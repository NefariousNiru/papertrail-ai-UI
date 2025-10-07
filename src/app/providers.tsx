// src/app/providers.tsx
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeMount } from "../features/theme/ThemeMount";

const queryClient = new QueryClient();

/**
 * Flow comment:
 * Providers wraps global contexts (Query, Theme, Toaster).
 * We keep this small for a hackathon-lean stack.
 */
export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeMount />
      {children}
    </QueryClientProvider>
  );
}
