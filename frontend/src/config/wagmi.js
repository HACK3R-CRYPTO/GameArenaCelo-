import { http, createConfig } from 'wagmi';
import { celo } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const customCelo = {
  ...celo,
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public: { http: ['https://forno.celo.org'] },
  }
}

export const config = createConfig({
  chains: [customCelo],
  connectors: [
    injected(),
  ],
  transports: {
    [customCelo.id]: http('https://forno.celo.org'),
  },
  pollingInterval: 30_000,
  batch: { multicall: true },
});


