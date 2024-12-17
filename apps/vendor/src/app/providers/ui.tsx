import { queryClient } from '@/shared/lib'
import { SidebarProvider, Toaster } from '@/shared/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster />
    </SidebarProvider>
  )
}
