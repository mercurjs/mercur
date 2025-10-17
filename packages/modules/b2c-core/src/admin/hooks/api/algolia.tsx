import { useMutation, useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const algoliaQueryKeys = queryKeysFactory('algolia')

export const useSyncAlgolia = () => {
  return useMutation({
    mutationFn: () =>
      mercurQuery('/admin/algolia', {
        method: 'POST'
      })
  })
}

export const useAlgolia = () => {
  return useQuery({
    queryKey: ['algolia'],
    queryFn: () => mercurQuery('/admin/algolia', { method: 'GET' })
  })
}
