'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/lib/types';
import Card from '@/components/ui/Card';
import { shortenAddress, formatTimestamp } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import { Users, ChevronRight, Calendar, Crown } from 'lucide-react';

export interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const creatorName = getDemoName(group.creator);

  return (
    <Link href={`/group/${group.id.toString()}`} className="block group">
      <Card
        hover
        className="h-full flex flex-col justify-between border-surface-600/50 hover:border-primary-500/50 transition-all duration-300 relative overflow-hidden"
      >
        {/* Subtle accent gradient on card hover */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500/0 via-primary-500/50 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-1">
              {group.name}
            </h3>
            <span className="shrink-0 p-1.5 rounded-lg bg-surface-800 text-surface-400 group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
              <ChevronRight className="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-surface-300">
            <div className="flex items-center gap-1.5 bg-surface-800/80 px-2.5 py-1 rounded-lg border border-surface-700/60">
              <Users className="h-3.5 w-3.5 text-primary-400" />
              <span>
                <strong className="text-white font-semibold">{group.members.length}</strong>{' '}
                {group.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-surface-400">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>By {creatorName || shortenAddress(group.creator)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-surface-700/60 flex items-center justify-between text-[11px] text-surface-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>Created {formatTimestamp(group.createdAt)}</span>
          </div>
          <span className="text-primary-400 font-medium group-hover:underline">
            View Group →
          </span>
        </div>
      </Card>
    </Link>
  );
}
