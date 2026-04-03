import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import toast from "react-hot-toast";
import { useIdentitySDK, IdentitySDK } from '@goodsdks/identity-sdk';
import { ClaimSDK } from '@goodsdks/citizen-sdk';

const SelfVerificationContext = createContext(undefined);

export function SelfVerificationProvider({ children }) {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    // useIdentitySDK handles async init internally — no manual init needed
    const identitySDK = useIdentitySDK("production");

    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [entitlement, setEntitlement] = useState(0n);
    const hasCheckedRef = useRef(false);
    const lastAddressRef = useRef(null);

    // Reset state when wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            setIsVerified(false);
            setEntitlement(0n);
            hasCheckedRef.current = false;
            lastAddressRef.current = null;
        }
    }, [isConnected]);

    const checkEntitlement = useCallback(async () => {
        if (!address || !publicClient || !identitySDK) return 0n;
        try {
            const claimSDK = new ClaimSDK({
                account: address,
                publicClient,
                walletClient,
                identitySDK,
                env: 'production',
            });
            const result = await claimSDK.checkEntitlement();
            setEntitlement(result.amount);
            return result.amount;
        } catch (error) {
            console.error("Check Entitlement Error:", error);
            return 0n;
        }
    }, [address, publicClient, walletClient, identitySDK]);

    const claimG$ = useCallback(async () => {
        if (!address || !publicClient || !walletClient || !identitySDK) {
            toast.error("Wallet not ready. Please try again.");
            return;
        }
        const toastId = toast.loading("Checking eligibility and claiming...");
        try {
            const claimSDK = new ClaimSDK({
                account: address,
                publicClient,
                walletClient,
                identitySDK,
                env: 'production',
            });
            const receipt = await claimSDK.claim();
            toast.success("G$ claimed successfully!", { id: toastId });
            checkEntitlement();
            return receipt;
        } catch (error) {
            console.error("Claim Error:", error);
            toast.error(error.message || "Failed to claim G$", { id: toastId });
        }
    }, [address, publicClient, walletClient, identitySDK, checkEntitlement]);

    // Check verification status — guard to only run once per address
    const checkVerificationStatus = useCallback(async () => {
        if (!isConnected || !address || !publicClient || !identitySDK) {
            setIsVerified(false);
            return false;
        }

        // Use cache if already checked for this address
        if (hasCheckedRef.current && lastAddressRef.current === address) {
            return isVerified;
        }

        // Check localStorage first (1 week cache)
        const cached = localStorage.getItem(`gd_verified_${address.toLowerCase()}`);
        if (cached) {
            try {
                const { verified, timestamp } = JSON.parse(cached);
                if (verified && Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
                    setIsVerified(true);
                    hasCheckedRef.current = true;
                    lastAddressRef.current = address;
                    return true;
                }
            } catch (e) { /* ignore */ }
        }

        try {
            const claimSDK = new ClaimSDK({
                account: address,
                publicClient,
                walletClient,
                identitySDK,
                env: 'production',
            });
            const walletStatus = await claimSDK.getWalletClaimStatus();
            const verified = walletStatus.status !== "not_whitelisted";
            setIsVerified(verified);
            hasCheckedRef.current = true;
            lastAddressRef.current = address;

            if (verified) {
                localStorage.setItem(
                    `gd_verified_${address.toLowerCase()}`,
                    JSON.stringify({ verified: true, timestamp: Date.now() })
                );
            }
            return verified;
        } catch (error) {
            console.error("GoodDollar Identity Check Error:", error);
            setIsVerified(false);
            return false;
        }
    }, [isConnected, address, publicClient, walletClient, identitySDK, isVerified]);

    // Check verification when wallet connects or address changes
    useEffect(() => {
        if (isConnected && address && identitySDK && lastAddressRef.current !== address) {
            hasCheckedRef.current = false;
            checkVerificationStatus();
        }
    }, [isConnected, address, identitySDK]); // eslint-disable-line

    // Check entitlement periodically
    useEffect(() => {
        if (isConnected && identitySDK && address) {
            checkEntitlement();
            const interval = setInterval(checkEntitlement, 60000);
            return () => clearInterval(interval);
        }
    }, [isConnected, identitySDK, address]); // eslint-disable-line

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

    const verifyIdentity = useCallback(async () => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!identitySDK || !walletClient) {
            // Wait up to 6s for SDK/wallet to be ready
            const waitId = toast.loading("Initializing GoodDollar SDK...");
            for (let i = 0; i < 12; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (identitySDK && walletClient) break;
            }
            toast.dismiss(waitId);
            if (!identitySDK || !walletClient) {
                toast.error("Could not initialize SDK. Try reconnecting your wallet.");
                return;
            }
        }

        setIsVerifying(true);
        const toastId = toast.loading("Generating Verification Link...");

        try {
            // Focus Pet pattern: create fresh IdentitySDK instance with positional args
            const idSDK = new IdentitySDK(publicClient, walletClient, "production");
            const linkResult = await idSDK.generateFVLink(false, window.location.href, 42220);

            let finalLink = typeof linkResult === "string" ? linkResult : (linkResult?.link ?? "");

            toast.dismiss(toastId);
            if (finalLink) {
                toast("Opening GoodDollar Face Verification...", { icon: "👤" });
                window.open(finalLink, '_blank', 'width=800,height=800');
            }

            // Poll for verification completion (5 min max)
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                hasCheckedRef.current = false;
                const verified = await checkVerificationStatus();
                if (verified) {
                    clearInterval(pollInterval);
                    setIsVerifying(false);
                    toast.success("Identity Verified successfully!");
                }
                if (attempts >= 60) {
                    clearInterval(pollInterval);
                    setIsVerifying(false);
                }
            }, 5000);
        } catch (error) {
            console.error("Failed to generate FV link:", error);
            toast.error("Failed to start verification process", { id: toastId });
            setIsVerifying(false);
        }
    }, [isConnected, address, identitySDK, walletClient, publicClient, checkVerificationStatus]);

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
