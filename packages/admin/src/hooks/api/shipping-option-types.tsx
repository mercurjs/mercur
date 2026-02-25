import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const SHIPPING_OPTION_TYPES_QUERY_KEY = "shipping_option_types" as const
export const shippingOptionTypesQueryKeys = queryKeysFactory(
  SHIPPING_OPTION_TYPES_QUERY_KEY
)

export const useShippingOptionType = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.shippingOptionTypes.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingOptionTypes.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingOptionTypes.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.shippingOptionTypes.$id.query({ $id: id, ...query }),
    queryKey: shippingOptionTypesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useShippingOptionTypes = (
  query?: InferClientInput<typeof sdk.admin.shippingOptionTypes.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingOptionTypes.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingOptionTypes.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingOptionTypes.query({ ...query }),
    queryKey: shippingOptionTypesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateShippingOptionType = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptionTypes.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.shippingOptionTypes.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingOptionTypes.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateShippingOptionType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptionTypes.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.shippingOptionTypes.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.shippingOptionTypes.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteShippingOptionType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptionTypes.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingOptionTypes.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
