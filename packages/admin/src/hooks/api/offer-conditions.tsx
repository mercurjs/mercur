import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"

const OFFER_CONDITIONS_QUERY_KEY = "offer_conditions" as const
export const offerConditionsQueryKeys = queryKeysFactory(
  OFFER_CONDITIONS_QUERY_KEY
)

export const useOfferConditions = (
  query?: InferClientInput<typeof sdk.admin.offerConditions.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.offerConditions.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.offerConditions.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.offerConditions.query({ ...query }),
    queryKey: offerConditionsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOfferCondition = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.offerConditions.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.offerConditions.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.offerConditions.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.offerConditions.$id.query({ $id: id, ...query }),
    queryKey: offerConditionsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateOfferCondition = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.offerConditions.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.offerConditions.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.offerConditions.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerConditionsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateOfferCondition = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.offerConditions.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.offerConditions.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.offerConditions.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerConditionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: offerConditionsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteOfferConditionLazy = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.offerConditions.$id.delete>,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (id: string) =>
      sdk.admin.offerConditions.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerConditionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: offerConditionsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
