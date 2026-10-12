import React from 'react';
import { Balance } from '@/lib/types';
import Card from '@/components/ui/Card';
import { formatEther, shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import { TrendingUp, TrendingDown, Check } from 'lucide-react';

export interface BalanceCardProps {
  balance: Balance;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const memberName = getDemoName(balance.member);
  const isPositive = balance.amount > 0n;
  const isNegative = balance.amount < 0n;
  const isZero = balance.amount === 0n;

  // Format amount (without negative sign for display since label indicates "owes")
  const absAmount = isNegative ? -balance.amount : balance.amount;
  const formattedAmount = `${formatEther(absAmount)} MON`;

  return (
    <Card className="border-surface-600/50 hover:border-surface-500/80 transition-all p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isPositive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isNegative
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-surface-700/60 border-surface-600/40 text-surface-400'
            }`}
          >
            {isPositive && <TrendingUp className="h-5 w-5" />}
            {isNegative && <TrendingDown className="h-5 w-5" />}
            {isZero && <Check className="h-5 w-5 text-emerald-400" />}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {memberName || shortenAddress(balance.member)}
            </h4>
            <p className="text-xs font-mono text-surface-400 truncate">
              {shortenAddress(balance.member)}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`text-base font-bold ${
              isPositive
                ? 'text-emerald-400'
                : isNegative
                ? 'text-rose-400'
                : 'text-surface-300'
            }`}
          >
            {isPositive && `+${formattedAmount}`}
            {isNegative && `-${formattedAmount}`}
            {isZero && '0.0000 MON'}
          </div>

          <div className="text-[11px] font-medium tracking-wide">
            {isPositive && (
              <span className="text-emerald-400/80">receives</span>
            )}
            {isNegative && <span className="text-rose-400/80">owes</span>}
            {isZero && <span className="text-surface-400">settled</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
