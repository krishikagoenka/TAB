export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const CHAIN_RPC_URL =
  process.env.NEXT_PUBLIC_CHAIN_RPC_URL || 'https://testnet-rpc.monad.xyz';

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 10143);

export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const contractsConfig = {
  CONTRACT_ADDRESS,
  CHAIN_RPC_URL,
  CHAIN_ID,
  USE_MOCK,
};

export default contractsConfig;
