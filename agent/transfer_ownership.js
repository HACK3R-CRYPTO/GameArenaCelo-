#!/usr/bin/env node
/**
 * Transfer ArenaPlatform ownership to the AI Agent wallet
 * so it can call resolveMatch()
 * 
 * Run with: node transfer_ownership.js <DEPLOYER_PRIVATE_KEY>
 */
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const ARENA_ADDRESS = '0x5C0eafE7834Bd317D998A058A71092eEBc2DedeE';
const AGENT_ADDRESS = '0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1';

// You must pass the DEPLOYER's private key (the wallet that deployed the contract)
const DEPLOYER_KEY = process.argv[2];
if (!DEPLOYER_KEY) {
    console.error('Usage: node transfer_ownership.js <DEPLOYER_PRIVATE_KEY>');
    process.exit(1);
}

const ABI = parseAbi([
    'function owner() view returns (address)',
    'function transferOwnership(address newOwner) external',
]);

const account = privateKeyToAccount(DEPLOYER_KEY);
const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
const walletClient = createWalletClient({ account, chain: celo, transport: http('https://forno.celo.org') });

async function main() {
    const currentOwner = await publicClient.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'owner' });
    console.log(`Current owner: ${currentOwner}`);
    console.log(`Your wallet:   ${account.address}`);

    if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
        console.error('❌ Your wallet is NOT the current owner. Cannot transfer ownership.');
        console.log(`   The current owner is: ${currentOwner}`);
        process.exit(1);
    }

    console.log(`\nTransferring ownership to agent: ${AGENT_ADDRESS}`);
    const hash = await walletClient.writeContract({
        address: ARENA_ADDRESS,
        abi: ABI,
        functionName: 'transferOwnership',
        args: [AGENT_ADDRESS],
    });
    console.log(`TX: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Ownership transferred! The agent can now call resolveMatch()');
}

main().catch(console.error);
