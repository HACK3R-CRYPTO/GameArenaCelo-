# GameArena Subgraph

Indexes the four GameArena production contracts on Celo Mainnet:

| Contract | Address |
|---|---|
| GamePass | `0xBB044d6780885A4cDb7E6F40FCc92FF7b051DAdE` |
| HabitatRegistry | `0x8888FEb43ac1833c683D0474204aa55A55BD010F` |
| SoloWager | `0xc78A8A027e07Ae5d52981f627bbac973a8d77eFb` |

Why this exists: leaderboards, player stats, and aggregate metrics are recomputable from on-chain events. Indexing them here means the Express backend stops reading them from Supabase, which fixes the egress bill and gives third parties a clean GraphQL surface.

## Setup

```sh
cd subgraph
npm install
npm run codegen   # generates TypeScript bindings from schema + ABIs
npm run build     # compiles AssemblyScript handlers
```

## Deploy to Goldsky

```sh
# One-time login (uses GOLDSKY_API_KEY env var or interactive)
npx goldsky login

# Deploy. Slug `gamearena/1.0.0` — bump version on schema changes.
npm run deploy:goldsky
```

After deploy Goldsky returns a GraphQL endpoint like:

```
https://api.goldsky.com/api/public/<PROJECT_ID>/subgraphs/gamearena/1.0.0/gn
```

Drop that into the frontend as `NEXT_PUBLIC_SUBGRAPH_URL` and start querying.

## Sample queries

Top 10 leaderboard by best Rhythm score:

```graphql
{
  players(first: 10, orderBy: bestRhythmScore, orderDirection: desc, where: { bestRhythmScore_gt: "0" }) {
    id
    username
    bestRhythmScore
    rhythmPlays
    highestHabitatTier
  }
}
```

A wallet's habitat collection:

```graphql
{
  player(id: "0xabc...") {
    username
    totalUbiDonated
    highestHabitatTier
    ownedHabitats(orderBy: tier) {
      tier
      unlockedAt
      ubiAmount
    }
  }
}
```

Daily UBI flow for the last 30 days:

```graphql
{
  dailyStats(first: 30, orderBy: date, orderDirection: desc) {
    date
    habitatUnlocks
    ubiDonatedG
    scoresRecorded
    newPlayers
  }
}
```

Global totals (one row, id = "global"):

```graphql
{
  globalStat(id: "global") {
    totalPlayers
    totalScores
    totalHabitatUnlocks
    totalUbiDonatedG
    totalTreasuryG
    totalWageredG
  }
}
```

## Adding new contracts later

1. Drop the ABI into `abis/`
2. Add a `dataSource` block to `subgraph.yaml` with the contract address and start block
3. Write a handler in `src/`
4. Add any new entities to `schema.graphql`
5. `npm run codegen && npm run build && npm run deploy:goldsky`

## Notes

- `startBlock` for each contract is set just before the first known activity to skip empty blocks. Keep these accurate so re-indexes are fast.
- `Player.username` updates on `UsernameChanged`; the latest value always wins.
- Free habitat tiers (1-5) are level-derived and live off-chain. Only paid tiers (6+) appear in `PlayerHabitat`.
- Wager rows mutate (`status`, `payout`) when `WagerResolved` fires; if the resolver event is somehow missed the row stays in `status: 0` (pending).
