'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { ToastProvider } from '@/components/ui/Toast';

import { MockProvider } from '@/lib/mock/mockAdapter';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MockProvider>
          <ToastProvider>{children}</ToastProvider>
        </MockProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
