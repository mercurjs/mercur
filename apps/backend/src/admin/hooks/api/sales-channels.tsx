import { useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'

export const useSalesChannels = (query?: Record<string, string | number>) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-channels'],
    queryFn: () =>
      mercurQuery('/admin/sales-channels', { method: 'GET', query })
  })

  return { ...data, isLoading }
}
