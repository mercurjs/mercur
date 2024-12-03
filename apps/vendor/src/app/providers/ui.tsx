import { queryClient } from '@/shared/lib'
import { QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
