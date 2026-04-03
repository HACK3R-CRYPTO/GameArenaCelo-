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

export const config = createConfig({
  chains: [customCelo],
  transports: {
    [customCelo.id]: http('https://forno.celo.org'),
  },
  pollingInterval: 30_000,
  batch: { multicall: true },
});
