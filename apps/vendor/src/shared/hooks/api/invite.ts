import { queryKeysFactory } from '@/shared/lib'
import { useQuery } from '@tanstack/react-query'
import { api } from './config'

const INVITE_QUERY_KEY = 'invite' as const
export const inviteQueryKeys = queryKeysFactory(INVITE_QUERY_KEY)

export const useListInvites = (
  params?: Parameters<typeof api.vendor.vendorListInvites>[0]
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => api.vendor.vendorListInvites(params),
    queryKey: inviteQueryKeys.list(params)
  })

  return {
    ...data,
    ...rest
  }
}
