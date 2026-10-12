'use client';

import React, { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GroupList from '@/components/group/GroupList';
import CreateGroupModal from '@/components/group/CreateGroupModal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Plus, Wallet, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { USE_MOCK } from '@/lib/contracts';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, isConnecting } = useAccount();
  const { connectors, connect } = useConnect();

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-700/60">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Your Groups</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
                {USE_MOCK ? 'Demo Mode' : 'Monad Live'}
              </span>
            </h1>
            <p className="text-sm text-surface-300 mt-1">
              Manage shared expenses, track balances, and settle debts automatically.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Group</span>
          </Button>
        </div>

        {/* Not connected wallet banner */}
        {!isConnected && !isConnecting && (
          <Card className="border-primary-500/30 bg-gradient-to-r from-primary-950/40 via-surface-800 to-surface-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Connect Your Wallet
                </h3>
                <p className="text-xs text-surface-300 max-w-xl leading-relaxed">
                  Connect your Monad wallet to create groups, approve pending expense claims, and trigger smart settlements.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleConnect}
              className="shrink-0"
            >
              Connect Wallet
            </Button>
          </Card>
        )}

        {/* Group List Grid */}
        <div className="space-y-4">
          <GroupList onCreateGroup={() => setIsModalOpen(true)} />
        </div>
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
