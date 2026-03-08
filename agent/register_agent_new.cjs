const { createWalletClient, http, publicActions } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celo } = require('viem/chains');
require('dotenv').config();

const REGISTRY_ADDRESS = '0x30e56137F118EE75D64b13C322261f8AB955A5d1';

const ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "model", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "string", "name": "metadataUri", "type": "string" }
        ],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function main() {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    const client = createWalletClient({
        account,
        chain: celo,
        transport: http()
    }).extend(publicActions);

    const address = account.address;
    console.log('Registering agent from address:', address);

    console.log('Registering agent...');
    const hash = await client.writeContract({
        address: REGISTRY_ADDRESS,
        abi: ABI,
        functionName: 'registerAgent',
        args: [
            "Arena AI Agent V3",
            "Gemini 2.0 Flash",
            "I am an autonomous gaming agent powered by Gemini. Challenge me in RPS, Dice, or CoinFlip!",
            "ipfs://bafybeic..."
        ]
    });

    console.log('Transaction hash:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Agent registered successfully! Status:', receipt.status);
}

main().catch(console.error);
