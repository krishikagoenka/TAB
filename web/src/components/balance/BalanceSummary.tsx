'use client';

import React from 'react';
import { useBalances } from '@/hooks/useBalances';
import BalanceCard from './BalanceCard';
import EmptyState from '@/components/ui/EmptyState';
import { formatEther } from '@/lib/utils';
import { Coins, AlertCircle, Scale } from 'lucide-react';

export interface BalanceSummaryProps {
  groupId: bigint;
}

export default function BalanceSummary({ groupId }: BalanceSummaryProps) {
  const { balances, isLoading, error } = useBalances(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6 border-surface-700/60 animate-pulse h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-card p-4 border-surface-700/60 animate-pulse h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-rose-400 font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading member balances</span>
        </div>
        <p className="text-xs text-surface-300">{error}</p>
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <EmptyState
        icon={<Scale className="h-8 w-8 text-primary-400" />}
        title="No balance data"
        description="Add expenses to see how much each member owes or is owed."
      />
    );
  }

  // Calculate total outstanding debt: sum of absolute values of negative balances
  const totalDebt = balances.reduce((sum, b) => {
    return b.amount < 0n ? sum + -b.amount : sum;
  }, 0n);

  const formattedTotalDebt = `${formatEther(totalDebt)} MON`;
  const settledCount = balances.filter((b) => b.amount === 0n).length;

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="glass-card p-6 border-surface-600/60 bg-gradient-to-r from-surface-800 via-surface-700/60 to-surface-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              Total Outstanding Volume
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {formattedTotalDebt}
            </div>
            <p className="text-xs text-surface-400 mt-0.5">
              Cumulative net balance to be settled across all members
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-900/60 p-3 rounded-xl border border-surface-700/80 shrink-0">
            <Coins className="h-5 w-5 text-primary-400" />
            <div className="text-xs">
              <span className="font-semibold text-white">
                {settledCount}/{balances.length}
              </span>{' '}
              <span className="text-surface-400">members settled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Balance Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-surface-200">
          Individual Balances
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {balances.map((balance) => (
            <BalanceCard key={balance.member} balance={balance} />
          ))}
        </div>
      </div>
    </div>
  );
}
