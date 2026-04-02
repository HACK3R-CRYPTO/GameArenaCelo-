# GameArena Frontend

React frontend for GameArena. Play skill games, wager G$, compete on weekly leaderboards, challenge an AI agent.

## What This Does

Connect your wallet. Mint a GamePass NFT with your username. Play Rhythm Rush and Simon Memory for free or wager G$. Challenge Markov-1 AI in Rock-Paper-Scissors, Dice, and Coin Flip. Track your rank on live leaderboards with weekly seasons.

## Prerequisites

- Node.js 18+
- Browser wallet (MetaMask, Valora, or any WalletConnect wallet)
- Celo Mainnet for on-chain features

## Installation

```bash
cd frontend
npm install
```

Create `.env` from the example:
```bash
cp .env.example .env
```

## Development

```bash
npm run dev    # http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Pages

| Page | Path | What It Does |
|---|---|---|
| `GamesHub.jsx` | `/` | Game selection, GamePass mint, wager setup, player stats |
| `RhythmRush.jsx` | `/rhythm` | Tap-the-beat rhythm game — score 350+ to win wager |
| `SimonGame.jsx` | `/simon` | Color sequence memory game — 7+ rounds to win |
| `ArenaGame.jsx` | `/arena` | PvP vs Markov-1 AI — RPS, Dice, Coin Flip |
| `Leaderboard.jsx` | `/leaderboard` | Rankings, season history, PvP arena stats |

## Key Features

- **GamePass NFT** — soulbound pass with username, shows on leaderboard
- **Free Play** — no wallet needed, scores saved to backend
- **Wager Mode** — lock G$, win 1.3x if you hit the score threshold
- **Weekly Seasons** — 7-day competitive windows with badge awards
- **PvP Arena** — wager G$ against adaptive AI agent
- **GoodDollar Identity** — face verification for wager mode
- **G$ Claim** — verified users claim daily UBI in-app
- **Anti-cheat** — cooldown between taps, score validation

## Configuration

Contract addresses in `src/config/contracts.js`:

```javascript
export const CONTRACT_ADDRESSES = {
  ARENA_PLATFORM: '0x5C0eafE7834Bd317D998A058A71092eEBc2DedeE',
  AI_AGENT:       '0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1',
  ARENA_TOKEN:    '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
};

export const SOLO_WAGER_ADDRESS = '0xc78A8A027e07Ae5d52981f627bbac973a8d77eFb';
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── GamesHub.jsx          Game hub + GamePass mint
│   │   ├── ArenaGame.jsx         PvP arena vs AI
│   │   ├── RhythmRush.jsx        Rhythm game
│   │   ├── SimonGame.jsx         Memory game
│   │   └── Leaderboard.jsx       Rankings + seasons + PvP
│   ├── components/
│   │   └── LandingOverlay.jsx    Splash screen
│   ├── contexts/
│   │   └── SelfVerificationContext.jsx  GoodDollar identity
│   └── config/
│       └── contracts.js          Addresses + ABIs
├── public/
├── index.html
└── package.json
```

## Tech Stack

- React 18 + Vite
- wagmi + viem (Celo Mainnet)
- WalletConnect (Reown) + Web3Auth
- react-hot-toast for notifications
