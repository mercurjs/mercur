import { queryKeysFactory } from '@/shared/lib'
import { useQuery } from '@tanstack/react-query'
import { vendorGetInvites } from '@mercurjs/http-client'
import { VendorGetInvitesParams } from '../../../../../packages/http-client/dist/models'

const INVITE_QUERY_KEY = 'invite' as const
export const inviteQueryKeys = queryKeysFactory(INVITE_QUERY_KEY)

export const useListInvites = (params?: VendorGetInvitesParams) => {
  const { data, ...rest } = useQuery({
    queryFn: () => vendorGetInvites(params),
    queryKey: inviteQueryKeys.list(params)
  })

  return {
    ...data,
    ...rest
  }
}
