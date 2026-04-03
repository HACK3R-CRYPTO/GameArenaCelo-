import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { celo } from 'wagmi/chains';

const customCelo = {
  ...celo,
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public: { http: ['https://forno.celo.org'] },
  }
}

export const supportedChains = [customCelo];

// No injected() connector — Privy manages wallet connections exclusively.
// This prevents browser extensions (Rabby, MetaMask) from auto-connecting
// via wagmi when the user logs in with email/Google/Twitter.
export const config = createConfig({
  chains: [customCelo],
  transports: {
    [customCelo.id]: http('https://forno.celo.org'),
  },
  pollingInterval: 30_000,
  batch: { multicall: true },
});

