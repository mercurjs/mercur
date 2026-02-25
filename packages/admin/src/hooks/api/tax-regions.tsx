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

const TAX_REGIONS_QUERY_KEY = "tax_regions" as const
export const taxRegionsQueryKeys = queryKeysFactory(TAX_REGIONS_QUERY_KEY)

export const useTaxRegion = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.taxRegions.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.taxRegions.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.taxRegions.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: taxRegionsQueryKeys.detail(id),
    queryFn: () => sdk.admin.taxRegions.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useTaxRegions = (
  query?: InferClientInput<typeof sdk.admin.taxRegions.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.taxRegions.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.taxRegions.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.taxRegions.query({ ...query }),
    queryKey: taxRegionsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateTaxRegion = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRegions.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.taxRegions.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.taxRegions.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.all })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateTaxRegion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRegions.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.taxRegions.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.taxRegions.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: taxRegionsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteTaxRegion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRegions.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.taxRegions.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: taxRegionsQueryKeys.detail(id),
      })

      // Invalidate all detail queries, as the deleted tax region may have been a sublevel region
      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.details() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
