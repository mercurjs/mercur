import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const USERS_QUERY_KEY = "users" as const
const usersQueryKeys = {
  ...queryKeysFactory(USERS_QUERY_KEY),
  me: () => [USERS_QUERY_KEY, "me"],
}

// Shared by `useMe` and route loaders so every entry under the `me` key
// carries `permissions`.
export const meQueryOptions = (
  query?: Omit<InferClientInput<typeof sdk.admin.users.me.query>, "$id">
) => ({
  queryFn: () =>
    sdk.admin.users.me.query({
      ...query,
      fields: [query?.fields, "+permissions"].filter(Boolean).join(","),
    }),
  queryKey: usersQueryKeys.me(),
})

export const useMe = (
  query?: Omit<
    InferClientInput<typeof sdk.admin.users.me.query>,
    "$id"
  >,
  options?: UseQueryOptions<
    InferClientOutput<typeof sdk.admin.users.me.query>,
    ClientError,
    InferClientOutput<typeof sdk.admin.users.me.query>,
    QueryKey
  >
) => {
  const { data, ...rest } = useQuery({
    ...meQueryOptions(query),
    ...options,
  })

  return {
    ...data,
    ...rest,
  }
}

export const useUser = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.users.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.users.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.users.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.users.$id.query({ $id: id, ...query }),
    queryKey: usersQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUsers = (
  query?: InferClientInput<typeof sdk.admin.users.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.users.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.users.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.users.query({ ...query }),
    queryKey: usersQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateUser = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.users.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.users.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.users.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateMe = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.users.me.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.users.me.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.users.me.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateUser = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.users.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.users.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.users.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.me() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteUser = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.users.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.users.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.me() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
