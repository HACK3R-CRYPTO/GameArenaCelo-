#!/usr/bin/env node
/**
 * Diagnose active match state on-chain.
 * Run: node --input-type=module diagnose.js
 */
import { createPublicClient, http, parseAbi } from 'viem';
import { celo } from 'viem/chains';

const ARENA_ADDRESS = '0x5C0eafE7834Bd317D998A058A71092eEBc2DedeE';
const USER_ADDRESS = '0xa479b8c6030cBB01f8E9F6AcB2Ad2C757C81894d';
const AGENT_ADDRESS = '0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1';

const ABI = parseAbi([
    'function matchCounter() view returns (uint256)',
    'function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)',
    'function hasPlayed(uint256 matchId, address player) view returns (bool)',
    'function playerMoves(uint256 matchId, address player) view returns (uint8)',
]);

const STATUS = ['Proposed', 'Accepted', 'Completed', 'Cancelled'];
const GAMES = ['RockPaperScissors', 'DiceRoll', 'StrategyBattle', 'CoinFlip', 'TicTacToe'];

const client = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });

async function main() {
    const total = await client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'matchCounter' });
    console.log(`\nTotal matches: ${total}`);

    for (let i = 0n; i < total; i++) {
        const m = await client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'matches', args: [i] });
        const [id, challenger, opponent, wager, gameType, status] = m;
        console.log(`\n=== Match #${id} (${GAMES[gameType]}) — ${STATUS[status]} ===`);
        console.log(`  Challenger: ${challenger}`);
        console.log(`  Opponent:   ${opponent}`);

        if (status === 1 || status === 2) {
            const [cpUser, cpAgent] = await Promise.all([
                client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'hasPlayed', args: [i, USER_ADDRESS] }),
                client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'hasPlayed', args: [i, AGENT_ADDRESS] }),
            ]);
            console.log(`  User  hasPlayed: ${cpUser}`);
            console.log(`  Agent hasPlayed: ${cpAgent}`);

            if (cpUser) {
                const move = await client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'playerMoves', args: [i, USER_ADDRESS] });
                console.log(`  User  move: ${move}`);
            }
            if (cpAgent) {
                const move = await client.readContract({ address: ARENA_ADDRESS, abi: ABI, functionName: 'playerMoves', args: [i, AGENT_ADDRESS] });
                console.log(`  Agent move: ${move}`);
            }
        }
    }
    console.log('\nDone.');
}

main().catch(console.error);
