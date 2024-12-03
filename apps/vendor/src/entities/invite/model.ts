import { queryKeysFactory } from '@/shared/lib'
import { useQuery } from '@tanstack/react-query'
import { vendorListInvites } from '@mercurjs/http-client'
import { VendorListInvitesParams } from '@mercurjs/http-client/types'

const INVITE_QUERY_KEY = 'invite' as const
export const inviteQueryKeys = queryKeysFactory(INVITE_QUERY_KEY)

export const useListInvites = (params?: VendorListInvitesParams) => {
  const { data, ...rest } = useQuery({
    queryFn: () => vendorListInvites(params),
    queryKey: inviteQueryKeys.list(params)
  })

  return {
    ...data,
    ...rest
  }
}
