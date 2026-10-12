import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-800/80 border-t border-surface-700/60 py-8 px-4 text-center mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold text-surface-200">
          TAB — the group wallet that settles itself
        </p>
        <p className="text-xs text-surface-400 flex items-center justify-center gap-1.5">
          <span>Built with</span>
          <span className="text-rose-500 animate-pulse">♥</span>
          <span>for Monad</span>
        </p>
        <p className="text-[11px] text-surface-500 mt-2">
          Hackathon Project • Powered by Monad Testnet & Smart Contracts
        </p>
      </div>
    </footer>
  );
}
