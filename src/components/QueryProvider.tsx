"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// Type for errors that might have a status property
interface ErrorWithStatus extends Error {
  status?: number;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: ErrorWithStatus) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status && error.status >= 400 && error.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
      mutations: {
        retry: (failureCount, error: ErrorWithStatus) => {
          // Don't retry mutations on 4xx errors
          if (error?.status && error.status >= 400 && error.status < 500) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
} 