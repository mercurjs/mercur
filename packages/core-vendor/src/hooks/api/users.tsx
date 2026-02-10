import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { StoreVendor, TeamMemberProps } from "../../types/user"

const USERS_QUERY_KEY = "users" as const
const usersQueryKeys = {
  ...queryKeysFactory(USERS_QUERY_KEY),
  me: () => [USERS_QUERY_KEY, "me"],
}

export const useMe = (
  options?: UseQueryOptions<
    HttpTypes.AdminUserResponse,
    FetchError,
    HttpTypes.AdminUserResponse & {
      seller: StoreVendor
    },
    QueryKey
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      fetchQuery("/vendor/sellers/me", {
        method: "GET",
        query: {
          fields:
            "id,name,description,phone,email,media,address_line,postal_code,country_code,city,region,metadata,tax_id,photo,store_status",
        },
      }),
    queryKey: usersQueryKeys.me(),
    ...options,
  })

  return {
    seller: data?.seller,
    ...rest,
  }
}

export const useUpdateMe = (
  options?: UseMutationOptions<
    HttpTypes.AdminUserResponse,
    FetchError,
    StoreVendor,
    QueryKey
  >
) => {
  return useMutation({
    mutationFn: (body) =>
      fetchQuery("/vendor/sellers/me", {
        method: "POST",
        body,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.me(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useOnboarding = () => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/sellers/me/onboarding", {
        method: "GET",
      }),
    queryKey: ["onboarding"],
    staleTime: 0,
  })

  return {
    ...data,
    ...rest,
  }
}

export const useUpdateOnboarding = () => {
  return useMutation({
    mutationFn: () =>
      fetchQuery("/vendor/sellers/me/onboarding", {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding"],
      })
    },
  })
}

export const useUserMe = (
  query?: HttpTypes.AdminUserParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminUserResponse,
      FetchError,
      HttpTypes.AdminUserResponse & {
        member: TeamMemberProps
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/me`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: [USERS_QUERY_KEY, "user", "me"],
    ...options,
  })

  return { ...data, ...rest }
}

export const useStatistics = ({ from, to }: { from: string; to: string }) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(
        `/vendor/statistics?time_from=${from}T00:00:00Z&time_to=${to}T23:59:59Z`,
        {
          method: "GET",
        }
      ),
    queryKey: [USERS_QUERY_KEY, "statistics"],
  })

  return { ...data, ...rest }
}

export const useUser = (
  id: string,
  query?: HttpTypes.AdminUserParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminUserResponse,
      FetchError,
      HttpTypes.AdminUserResponse & {
        member: TeamMemberProps
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/members/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: usersQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUsers = (
  query?: HttpTypes.AdminUserListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminUserListResponse,
      FetchError,
      HttpTypes.AdminUserListResponse & { members: any[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/members", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: usersQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateUser = (
  id: string,
  options?: UseMutationOptions<
    TeamMemberProps,
    FetchError,
    {
      name?: string
      photo?: string
      language?: string
      phone?: string
      bio?: string
      metadata?: Record<string, unknown>
    },
    QueryKey
  >
) => {
  return useMutation({
    mutationFn: (body) =>
      fetchQuery(`/vendor/members/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.lists(),
      })

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({
        queryKey: [USERS_QUERY_KEY, "user", "me"],
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteUser = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminUserDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/members/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.lists(),
      })

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.me(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
