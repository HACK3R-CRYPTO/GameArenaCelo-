import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { createPublicClient, http } from "viem";
import toast from "react-hot-toast";
import { IdentitySDK, ClaimSDK } from '@goodsdks/citizen-sdk';

const SelfVerificationContext = createContext(undefined);

// Static Celo chain definition to bypass Reown RPC proxy
const CELO_CHAIN = {
    id: 42220,
    name: 'Celo',
    network: 'celo',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    rpcUrls: { default: { http: ['https://forno.celo.org'] }, public: { http: ['https://forno.celo.org'] } },
};

// Static publicClient — created once, never re-created. Bypasses Reown proxy entirely.
const staticPublicClient = createPublicClient({
    chain: CELO_CHAIN,
    transport: http('https://forno.celo.org'),
});

export function SelfVerificationProvider({ children }) {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [identitySDK, setIdentitySDK] = useState(null);
    const [claimSDK, setClaimSDK] = useState(null);
    const [entitlement, setEntitlement] = useState(0n);
    const hasCheckedRef = useRef(false); // Prevent repeated checks on re-renders
    const lastAddressRef = useRef(null);

    // Initialize IdentitySDK and ClaimSDK once wallet connects — uses static publicClient for reads
    useEffect(() => {
        let isMounted = true;

        async function initSDKs() {
            if (isConnected && walletClient && address && isMounted) {
                try {
                    console.log("🛠️ Attempting to initialize SDKs for:", address);

                    // Attempt init which handles account retrieval automatically if possible
                    const iSDK = await IdentitySDK.init({
                        publicClient: staticPublicClient,
                        walletClient,
                        env: 'production'
                    });

                    const cSDK = await ClaimSDK.init({
                        publicClient: staticPublicClient,
                        walletClient,
                        identitySDK: iSDK,
                        env: 'production'
                    });

                    console.log("✅ SDKs initialized successfully for:", address);
                    if (isMounted) {
                        setIdentitySDK(iSDK);
                        setClaimSDK(cSDK);
                        hasCheckedRef.current = false; // Reset check
                    }
                } catch (error) {
                    console.warn("⚠️ SDK.init failed, retrying with manual constructor:", error.message);

                    // Fallback to manual constructor if init fails
                    try {
                        const iSDK = new IdentitySDK({
                            account: address,
                            publicClient: staticPublicClient,
                            walletClient,
                            env: 'production'
                        });
                        const cSDK = new ClaimSDK({
                            account: address,
                            publicClient: staticPublicClient,
                            walletClient,
                            identitySDK: iSDK,
                            env: 'production'
                        });
                        console.log("✅ SDKs initialized via manual constructor");
                        if (isMounted) {
                            setIdentitySDK(iSDK);
                            setClaimSDK(cSDK);
                            hasCheckedRef.current = false;
                        }
                    } catch (retryError) {
                        console.error("❌ Both SDK initialization methods failed:", retryError);
                        toast.error(`SDK Error: ${retryError.message || "Initialization failed"}`);
                    }
                }
            } else if (isMounted) {
                if (isConnected && (!walletClient || !address)) {
                    console.log("⏳ Wallet connected, but waiting for details...", { walletClient: !!walletClient, address });
                }
                setIdentitySDK(null);
                setClaimSDK(null);
                setEntitlement(0n);
            }
        }

        initSDKs();
        return () => { isMounted = false; };
    }, [isConnected, walletClient, address]);

    const checkEntitlement = useCallback(async () => {
        if (!claimSDK || !address) return 0n;
        try {
            const result = await claimSDK.checkEntitlement();
            setEntitlement(result.amount);
            return result.amount;
        } catch (error) {
            console.error("Check Entitlement Error:", error);
            return 0n;
        }
    }, [claimSDK, address]);

    // Periodically check entitlement
    useEffect(() => {
        if (isConnected && claimSDK) {
            checkEntitlement();
            const interval = setInterval(checkEntitlement, 60000); // Every minute
            return () => clearInterval(interval);
        }
    }, [isConnected, claimSDK, checkEntitlement]);

    const claimG$ = useCallback(async () => {
        if (!claimSDK) {
            toast.error("Claim SDK not ready");
            return;
        }

        const toastId = toast.loading("Checking eligibility and claiming...");
        try {
            const receipt = await claimSDK.claim();
            toast.success("G$ claimed successfully!", { id: toastId });
            checkEntitlement();
            return receipt;
        } catch (error) {
            console.error("Claim Error:", error);
            toast.error(error.message || "Failed to claim G$", { id: toastId });
        }
    }, [claimSDK, checkEntitlement]);

    // Check verification status — guarded to only run once per address change
    const checkVerificationStatus = useCallback(async () => {
        if (!isConnected || !address || !identitySDK) {
            setIsVerified(false);
            return false;
        }

        // Already checked for this address — use cache
        if (hasCheckedRef.current && lastAddressRef.current === address) {
            return isVerified;
        }

        // Check localStorage first (avoid RPC calls if recently verified)
        const cached = localStorage.getItem(`gd_verified_${address.toLowerCase()}`);
        if (cached) {
            try {
                const { verified, timestamp } = JSON.parse(cached);
                const oneWeek = 7 * 24 * 60 * 60 * 1000; // Extend cache to 1 week
                if (verified && Date.now() - timestamp < oneWeek) {
                    setIsVerified(true);
                    hasCheckedRef.current = true;
                    lastAddressRef.current = address;
                    return true;
                }
            } catch (e) { /* ignore */ }
        }

        try {
            const { isWhitelisted } = await identitySDK.getWhitelistedRoot(address);
            setIsVerified(isWhitelisted);
            hasCheckedRef.current = true;
            lastAddressRef.current = address;

            if (isWhitelisted) {
                localStorage.setItem(
                    `gd_verified_${address.toLowerCase()}`,
                    JSON.stringify({ verified: true, timestamp: Date.now() })
                );
            }
            return isWhitelisted;
        } catch (error) {
            console.error("GoodDollar Identity Check Error:", error);
            setIsVerified(false);
            return false;
        }
    }, [isConnected, address, identitySDK, isVerified]);

    const verifyIdentity = useCallback(async () => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!identitySDK) {
            toast.error("Identity SDK not initialized. Please wait.");
            return;
        }

        setIsVerifying(true);
        const toastId = toast.loading("Generating Verification Link...");

        try {
            const link = await identitySDK.generateFVLink(true, window.location.href, 42220);
            toast.dismiss(toastId);
            toast("Opening GoodDollar Face Verification...", { icon: "👤" });
            window.open(link, '_blank', 'width=800,height=800');

            // Poll for verification completion
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max
            const pollInterval = setInterval(async () => {
                attempts++;
                hasCheckedRef.current = false; // Force fresh check
                const verified = await checkVerificationStatus();
                if (verified) {
                    clearInterval(pollInterval);
                    setIsVerifying(false);
                    toast.success("Identity Verified successfully!");
                }
                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    setIsVerifying(false);
                }
            }, 5000);
        } catch (error) {
            console.error("Failed to generate FV link:", error);
            toast.error("Failed to start verification process", { id: toastId });
            setIsVerifying(false);
        }
    }, [isConnected, address, identitySDK, checkVerificationStatus]);

    // Only check once when wallet connects or address changes
    useEffect(() => {
        if (isConnected && address && identitySDK && lastAddressRef.current !== address) {
            hasCheckedRef.current = false;
            checkVerificationStatus();
        }
        if (!isConnected) {
            setIsVerified(false);
            hasCheckedRef.current = false;
            lastAddressRef.current = null;
        }
    }, [isConnected, address, identitySDK]); // intentionally exclude checkVerificationStatus

    // Listen for cross-window post-message from FV popup
    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.data?.isVerified === true || event.data?.success === true) {
                hasCheckedRef.current = false;
                await checkVerificationStatus();
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [checkVerificationStatus]);

    const SelfVerificationComponent = useMemo(() => {
        const Component = () => (
            <div className="flex flex-col items-center gap-4 p-6 bg-[#0a0a14] rounded-lg border border-purple-500/20">
                <div className="text-4xl animate-bounce mb-2">👤</div>
                <div className="text-sm text-gray-400 text-center max-w-sm space-y-2">
                    <p className="font-orbitron text-purple-400 mb-2">GOODDOLLAR IDENTITY</p>
                    <p>Verify your humanity via GoodDollar's Face Verification to unlock the Arena.</p>
                    <p className="text-xs text-green-400 mt-2">
                        Ensures fair gameplay, Sybil Resistance, and secures your G$ wagers.
                    </p>
                </div>
            </div>
        );
        return Component;
    }, []);

    const contextValue = useMemo(
        () => ({
            isVerified,
            isVerifying,
            verifyIdentity,
            claimG$,
            entitlement,
            cancelVerification: () => setIsVerifying(false),
            checkVerificationStatus,
            SelfVerificationComponent,
        }),
        [isVerified, isVerifying, verifyIdentity, claimG$, entitlement, checkVerificationStatus, SelfVerificationComponent]
    );

    return (
        <SelfVerificationContext.Provider value={contextValue}>
            {children}
        </SelfVerificationContext.Provider>
    );
}

export function useSelfVerification() {
    const context = useContext(SelfVerificationContext);
    if (context === undefined) {
        throw new Error("useSelfVerification must be used within a SelfVerificationProvider");
    }
    return context;
}
