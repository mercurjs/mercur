import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { client } from "../../lib/client"
import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"

const INVITES_QUERY_KEY = "vendor_invites" as const
export const invitesQueryKeys = queryKeysFactory(INVITES_QUERY_KEY)

export const useInvites = (
  query?: InferClientInput<typeof client.vendor.invites.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.vendor.invites.query>
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: invitesQueryKeys.list(query),
    queryFn: async () =>
      client.vendor.invites.query({
        ...query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateInvite = (
  options?: UseMutationOptions<
    InferClientOutput<typeof client.vendor.invites.mutate>,
    ClientError,
    { email: string }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) =>
      client.vendor.invites.mutate({
        ...payload,
        role: "member",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: invitesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useSignUpForInvite = (
  options?: UseMutationOptions<
    InferClientOutput<typeof client.auth.$actorType.$authProvider.register.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof client.auth.$actorType.$authProvider.register.mutate>,
      "$actorType" | "$authProvider"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      client.auth.$actorType.$authProvider.register.mutate({
        $actorType: "seller",
        $authProvider: "emailpass",
        ...payload,
      }),
    ...options,
  })
}

export const useAcceptInvite = (
  inviteToken: string,
  options?: UseMutationOptions<
    unknown,
    ClientError,
    { name: string; auth_token: string }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const { auth_token, ...rest } = payload

      return client.vendor.invites.accept.mutate({
        token: inviteToken,
        ...rest,
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${auth_token}`,
          },
        },
      })
    },
    ...options,
  })
}
