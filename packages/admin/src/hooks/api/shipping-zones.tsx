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

const SHIPPING_ZONES_QUERY_KEY = "shipping_zones" as const
export const shippingZonesQueryKeys = queryKeysFactory(SHIPPING_ZONES_QUERY_KEY)

export const useShippingZone = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.shippingZones.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingZones.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingZones.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingZones.$id.query({ $id: id, ...query }),
    queryKey: shippingZonesQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useShippingZones = (
  query?: Partial<InferClientInput<typeof sdk.admin.shippingZones.query>>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingZones.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingZones.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.shippingZones.query(
        { ...query } as InferClientInput<typeof sdk.admin.shippingZones.query>
      ),
    queryKey: shippingZonesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateShippingZone = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingZones.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.shippingZones.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingZones.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingZonesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateShippingZone = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingZones.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.shippingZones.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.shippingZones.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingZonesQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingZonesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingRulesQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteShippingZone = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingZones.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingZones.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingZonesQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingZonesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: shippingRulesQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
