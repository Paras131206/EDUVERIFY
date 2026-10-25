import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/lib/i18n';
import { initLanguageObserver } from '@/lib/translator';
import { ThemeProvider } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const cleanup = initLanguageObserver();
    return cleanup;
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
};
