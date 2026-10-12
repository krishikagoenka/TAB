'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import AddMemberForm from './AddMemberForm';
import { Users, Copy, Check, Crown, UserCheck } from 'lucide-react';

export interface MemberListProps {
  members: `0x${string}`[];
  groupId: bigint;
  onMemberAdded?: () => void;
}

export default function MemberList({
  members,
  groupId,
  onMemberAdded,
}: MemberListProps) {
  const { address } = useAccount();
  const { success, error: toastError } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddress(addr);
      success('Address copied!');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      toastError('Could not copy address');
    }
  };

  return (
    <Card className="space-y-5 border-surface-600/50">
      <div className="flex items-center justify-between pb-3 border-b border-surface-700/60">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-400" />
          <h3 className="font-semibold text-white">Group Members</h3>
        </div>
        <span className="text-xs text-surface-400 bg-surface-850 px-2.5 py-1 rounded-full border border-surface-700">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      <div className="divide-y divide-surface-700/50 max-h-72 overflow-y-auto pr-1">
        {members.map((member, index) => {
          const isCreator = index === 0;
          const isCurrentUser =
            !!address && member.toLowerCase() === address.toLowerCase();
          const demoName = getDemoName(member);
          const isCopied = copiedAddress === member;

          return (
            <div
              key={member}
              className="py-2.5 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-surface-700 border border-surface-600/80 flex items-center justify-center text-xs font-semibold text-primary-300 shrink-0">
                  {demoName ? demoName.charAt(0).toUpperCase() : '0x'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {demoName || shortenAddress(member)}
                    </span>
                    {isCreator && (
                      <Badge variant="warning" className="text-[10px] py-0 px-2 gap-1">
                        <Crown className="h-2.5 w-2.5" />
                        Creator
                      </Badge>
                    )}
                    {isCurrentUser && (
                      <Badge variant="info" className="text-[10px] py-0 px-2 gap-1">
                        <UserCheck className="h-2.5 w-2.5" />
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-surface-400 truncate">
                    {shortenAddress(member)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(member)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors shrink-0"
                title="Copy address"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <AddMemberForm
        groupId={groupId}
        members={members}
        onSuccess={onMemberAdded}
      />
    </Card>
  );
}
