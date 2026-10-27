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
import { shippingRulesQueryKeys } from "./shipping-rules"

const SHIPPING_METHODS_QUERY_KEY = "shipping_methods" as const
export const shippingMethodsQueryKeys = queryKeysFactory(
  SHIPPING_METHODS_QUERY_KEY
)

type ShippingMethodCutoffInput = { cutoff_time?: string | null }

export type CreateShippingMethodInput = InferClientInput<
  typeof sdk.admin.shippingMethods.mutate
> &
  ShippingMethodCutoffInput

export type UpdateShippingMethodInput = Omit<
  InferClientInput<typeof sdk.admin.shippingMethods.$id.mutate>,
  "$id"
> &
  ShippingMethodCutoffInput

export const useShippingMethod = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.shippingMethods.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingMethods.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingMethods.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingMethods.$id.query({ $id: id, ...query }),
    queryKey: shippingMethodsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useShippingMethods = (
  query?: Partial<InferClientInput<typeof sdk.admin.shippingMethods.query>>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingMethods.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingMethods.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.shippingMethods.query(
        { ...query } as InferClientInput<typeof sdk.admin.shippingMethods.query>
      ),
    queryKey: shippingMethodsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateShippingMethod = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingMethods.mutate>,
    ClientError,
    CreateShippingMethodInput
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingMethods.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingMethodsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateShippingMethod = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingMethods.$id.mutate>,
    ClientError,
    UpdateShippingMethodInput
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.shippingMethods.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingMethodsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingMethodsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingRulesQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteShippingMethod = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingMethods.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingMethods.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingMethodsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingMethodsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingRulesQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
