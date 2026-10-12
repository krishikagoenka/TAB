'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { Wallet, Copy, Check, LogOut, ChevronDown } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import { useToast } from '@/components/ui/Toast';

export default function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { success, error: toastError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = () => {
    try {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      toastError(message);
    }
  };

  useEffect(() => {
    if (connectError) {
      toastError(connectError.message || 'Connection failed');
    }
  }, [connectError, toastError]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError('Could not copy address');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    success('Wallet disconnected');
  };

  if (isConnecting) {
    return (
      <button
        type="button"
        disabled
        className="btn-primary inline-flex items-center gap-2 opacity-80 cursor-wait text-sm py-2 px-4 rounded-xl"
      >
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Connecting...</span>
      </button>
    );
  }

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4 rounded-xl shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  const displayName = getDemoName(address);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-surface-600/70 text-white text-sm font-medium transition-all shadow-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-mono text-xs text-surface-200">
          {displayName !== address ? `${displayName} (${shortenAddress(address)})` : shortenAddress(address)}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-800 border border-surface-600/80 shadow-2xl z-50 p-3 space-y-3 animate-fade-in">
          <div className="p-2 rounded-xl bg-surface-900/80 border border-surface-700">
            <div className="text-xs text-surface-400 mb-1">Connected Account</div>
            <div className="text-sm font-semibold text-white truncate">{displayName}</div>
            <div className="text-xs font-mono text-surface-300 break-all">{address}</div>
          </div>

          <div className="px-1 text-xs text-surface-400 flex items-center justify-between">
            <span>Network Chain ID</span>
            <span className="font-mono text-surface-200 font-semibold">{chainId}</span>
          </div>

          <div className="pt-1 border-t border-surface-700/80 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-surface-200 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-surface-400" />
              )}
              <span>{copied ? 'Copied address!' : 'Copy Address'}</span>
            </button>

            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
