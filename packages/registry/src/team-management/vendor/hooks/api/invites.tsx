import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { client } from "../../lib/client"
import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"

declare const __BACKEND_URL__: string

const BACKEND_URL = (typeof __BACKEND_URL__ !== "undefined"
  ? __BACKEND_URL__
  : "http://localhost:9000") as string

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
    string,
    Error,
    { email: string; password: string }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(
        `${BACKEND_URL}/auth/seller/emailpass/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to create account")
      }

      const data = await res.json()
      return data.token as string
    },
    ...options,
  })
}

export const useAcceptInvite = (
  inviteToken: string,
  options?: UseMutationOptions<
    unknown,
    Error,
    { name: string; auth_token: string }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const { auth_token, ...rest } = payload

      const res = await fetch(`${BACKEND_URL}/vendor/invites/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth_token}`,
        },
        body: JSON.stringify({ token: inviteToken, ...rest }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to accept invite")
      }

      return res.json()
    },
    ...options,
  })
}
