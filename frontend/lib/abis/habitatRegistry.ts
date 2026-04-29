// Minimal ABI for HabitatRegistry — only the entries the frontend actually calls.
// Keeping this trim makes wagmi's type inference faster and bundle size smaller.

export const habitatRegistryAbi = [
  // ── Reads ────────────────────────────────────────────────────────────────
  {
    type: "function", stateMutability: "view", name: "ownsHabitat",
    inputs: [
      { name: "player", type: "address" },
      { name: "tier",   type: "uint8" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function", stateMutability: "view", name: "tierCost",
    inputs: [{ name: "tier", type: "uint8" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "playerUbiDonated",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "totalCommunityContribution",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "ubiBps",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "treasuryBps",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "paused",
    inputs: [],
    outputs: [{ type: "bool" }],
  },

  // ── Writes ───────────────────────────────────────────────────────────────
  {
    type: "function", stateMutability: "nonpayable", name: "unlockHabitat",
    inputs: [{ name: "tier", type: "uint8" }],
    outputs: [],
  },

  // ── Events ───────────────────────────────────────────────────────────────
  {
    type: "event", name: "HabitatUnlocked",
    inputs: [
      { indexed: true,  name: "player",         type: "address" },
      { indexed: true,  name: "tier",           type: "uint8"   },
      { indexed: false, name: "totalPaid",      type: "uint256" },
      { indexed: false, name: "ubiAmount",      type: "uint256" },
      { indexed: false, name: "treasuryAmount", type: "uint256" },
    ],
  },
] as const;

// Standard ERC20 reads/writes we need for the G$ approve flow.
export const erc20Abi = [
  {
    type: "function", stateMutability: "view", name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "view", name: "allowance",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", stateMutability: "nonpayable", name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;
