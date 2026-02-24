import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { client } from "../../lib/client"
import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"

const MEMBERS_QUERY_KEY = "vendor_members" as const
export const membersQueryKeys = queryKeysFactory(MEMBERS_QUERY_KEY)

export type MemberDTO = InferClientOutput<
  typeof client.vendor.members.$id.query
>["member"]

export const useMembers = (
  query?: InferClientInput<typeof client.vendor.members.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.vendor.members.query>
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: membersQueryKeys.list(query),
    queryFn: async () =>
      client.vendor.members.query({
        ...query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useMember = (
  id: string,
  query?: InferClientInput<typeof client.vendor.members.$id.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.vendor.members.$id.query>
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: membersQueryKeys.detail(id, query),
    queryFn: async () =>
      client.vendor.members.$id.query({
        $id: id,
        ...query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateMember = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof client.vendor.members.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof client.vendor.members.$id.mutate>, "$id">
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) =>
      client.vendor.members.$id.mutate({
        ...payload,
        $id: id,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteMember = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof client.vendor.members.$id.delete>,
    ClientError
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () =>
      client.vendor.members.$id.delete({
        $id: id,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
