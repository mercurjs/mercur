import { useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'

export const useRegions = (query?: Record<string, string | number>) => {
  const { data, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () =>
      mercurQuery('/admin/regions', {
        method: 'GET',
        query
      })
  })

  return { ...data, isLoading }
}
