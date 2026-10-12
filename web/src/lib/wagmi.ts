import { createConfig, http, injected } from 'wagmi';
import { defineChain } from 'viem';
import { CHAIN_ID, CHAIN_RPC_URL } from '@/lib/contracts';

export const monadTestnet = defineChain({
  id: CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [CHAIN_RPC_URL],
    },
    public: {
      http: [CHAIN_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadExplorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(CHAIN_RPC_URL),
  },
  ssr: true,
});

export default wagmiConfig;
