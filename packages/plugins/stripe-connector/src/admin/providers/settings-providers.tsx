import { TooltipProvider } from "@medusajs/ui"
import { queryClient } from "@mercurjs/dashboard-shared"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

/** Settings routes mount outside the host dashboard's React providers, so each one supplies its own. */
export const SettingsProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>{children}</TooltipProvider>
  </QueryClientProvider>
)
