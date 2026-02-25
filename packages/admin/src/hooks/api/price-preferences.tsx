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

const PRICE_PREFERENCES_QUERY_KEY = "price-preferences" as const
export const pricePreferencesQueryKeys = queryKeysFactory(
  PRICE_PREFERENCES_QUERY_KEY
)

export const usePricePreference = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.pricePreferences.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.pricePreferences.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.pricePreferences.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.pricePreferences.$id.query({ $id: id, ...query }),
    queryKey: pricePreferencesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const usePricePreferences = (
  query?: InferClientInput<typeof sdk.admin.pricePreferences.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.pricePreferences.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.pricePreferences.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.pricePreferences.query({ ...query }),
    queryKey: pricePreferencesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpsertPricePreference = (
  id?: string | undefined,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.pricePreferences.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.pricePreferences.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      if (id) {
        return sdk.admin.pricePreferences.$id.mutate({
          $id: id,
          ...payload,
          attribute: (payload as any).attribute ?? undefined,
        })
      }
      return sdk.admin.pricePreferences.mutate(payload)
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      })
      if (id) {
        queryClient.invalidateQueries({
          queryKey: pricePreferencesQueryKeys.detail(id),
        })
      }

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeletePricePreference = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.pricePreferences.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.pricePreferences.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
