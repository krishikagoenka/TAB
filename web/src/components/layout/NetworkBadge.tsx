'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_ID } from '@/lib/contracts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const isCorrectNetwork = chainId === CHAIN_ID;
  const networkName = isCorrectNetwork ? 'Monad Testnet' : `Wrong Net (${chainId})`;

  const handleSwitch = () => {
    if (!isCorrectNetwork && switchChain) {
      switchChain({ chainId: CHAIN_ID });
    }
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isCorrectNetwork || isPending}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        isCorrectNetwork
          ? 'bg-surface-800/80 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 cursor-default'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 cursor-pointer animate-pulse'
      )}
      title={isCorrectNetwork ? 'Connected to Monad Testnet' : 'Click to switch to Monad Testnet'}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            isCorrectNetwork ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-ping'
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isCorrectNetwork ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        />
      </span>

      <span className="truncate max-w-[110px]">{isPending ? 'Switching...' : networkName}</span>

      {!isCorrectNetwork && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />}
      {isCorrectNetwork && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400/70" />}
    </button>
  );
}
