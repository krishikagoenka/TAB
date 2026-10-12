'use client';

import React from 'react';
import { useSettlement } from '@/hooks/useSettlement';
import { formatEther, shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import Card from '@/components/ui/Card';
import SettleButton from './SettleButton';
import EmptyState from '@/components/ui/EmptyState';
import {
  ArrowRightLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface SettlementPreviewProps {
  groupId: bigint;
  onSettled?: () => void;
}

export default function SettlementPreview({
  groupId,
  onSettled,
}: SettlementPreviewProps) {
  const { settlements, isLoading, error } = useSettlement(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6 border-surface-700/60 animate-pulse h-28" />
        <div className="glass-card p-6 border-surface-700/60 animate-pulse h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-rose-400 font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>Error calculating settlements</span>
        </div>
        <p className="text-xs text-surface-300">{error}</p>
      </div>
    );
  }

  if (!settlements || settlements.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
        title="All squared up!"
        description="There are no pending debts to settle in this group. Everyone is even!"
      />
    );
  }

  const totalSettleAmount = settlements.reduce(
    (sum, s) => sum + s.amount,
    0n
  );

  return (
    <div className="space-y-6">
      {/* Settlement Header & Action */}
      <Card className="border-surface-600/60 bg-surface-800/80 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-bold text-white">Settlement Plan</h3>
              <span className="text-[11px] font-semibold bg-primary-500/15 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Preview
              </span>
            </div>
            <p className="text-xs text-surface-300 mt-1">
              Optimized transfer route to minimize the number of on-chain transactions.
            </p>
          </div>

          <SettleButton groupId={groupId} onSettled={onSettled} />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-700/60 text-xs">
          <div>
            <span className="text-surface-400">Total Transfers Required:</span>
            <div className="text-lg font-bold text-white mt-0.5">
              {settlements.length} {settlements.length === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>
          <div>
            <span className="text-surface-400">Total Settlement Value:</span>
            <div className="text-lg font-bold text-primary-300 mt-0.5">
              {formatEther(totalSettleAmount)} MON
            </div>
          </div>
        </div>
      </Card>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <span className="font-semibold">Notice:</span> Executing settlement will trigger smart contract calls to rebalance and mark approved expenses as settled.
        </div>
      </div>

      {/* Transfer List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-surface-200">
          Proposed Direct Transfers
        </h4>
        <div className="space-y-3">
          {settlements.map((item, index) => {
            const fromName = getDemoName(item.from);
            const toName = getDemoName(item.to);

            return (
              <Card
                key={`${item.from}-${item.to}-${index}`}
                className="border-surface-600/50 hover:border-surface-500/80 transition-all p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* From -> To */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-semibold text-rose-400 border border-surface-600 shrink-0">
                      {fromName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {fromName}
                      </div>
                      <div className="text-[10px] font-mono text-surface-400 truncate">
                        {shortenAddress(item.from)}
                      </div>
                    </div>

                    <div className="flex items-center px-2 text-surface-400 shrink-0">
                      <ArrowRight className="h-4 w-4 text-primary-400" />
                    </div>

                    <div className="h-8 w-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-semibold text-emerald-400 border border-surface-600 shrink-0">
                      {toName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {toName}
                      </div>
                      <div className="text-[10px] font-mono text-surface-400 truncate">
                        {shortenAddress(item.to)}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-700/50">
                    <div className="text-base font-extrabold text-primary-300">
                      {formatEther(item.amount)} MON
                    </div>
                    <div className="text-[10px] text-surface-400 uppercase tracking-wider">
                      transfer amount
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
