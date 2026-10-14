import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { client } from "../client"

const spraay = client.admin.spraay

export const spraayBatchesQueryKeys = queryKeysFactory("spraay_batches")
export const spraayPreflightQueryKey = ["spraay_preflight"] as const

export type SpraayBatchList = InferClientOutput<typeof spraay.batches.query>
export type SpraayBatch = InferClientOutput<typeof spraay.batches.$batchId.query>["batch"]
export type SpraayBatchItem = SpraayBatch["items"][number]
export type SpraayPreflight = InferClientOutput<typeof spraay.preflight.query>

type QueryOptions<T> = Omit<UseQueryOptions<T, ClientError, T, QueryKey>, "queryKey" | "queryFn">

export const useSpraayBatches = (
  query?: InferClientInput<typeof spraay.batches.query>,
  options?: QueryOptions<SpraayBatchList>
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => spraay.batches.query({ ...query }),
    queryKey: spraayBatchesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useSpraayBatch = (
  id: string,
  options?: QueryOptions<InferClientOutput<typeof spraay.batches.$batchId.query>>
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => spraay.batches.$batchId.query({ $batchId: id }),
    queryKey: spraayBatchesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useSpraayPreflight = (options?: QueryOptions<SpraayPreflight>) => {
  const { data, ...rest } = useQuery({
    queryFn: () => spraay.preflight.query(),
    queryKey: spraayPreflightQueryKey,
    ...options,
  })

  return { preflight: data, ...rest }
}

const useInvalidateBatch = () => {
  const queryClient = useQueryClient()

  return (id?: string | null) => {
    queryClient.invalidateQueries({ queryKey: spraayBatchesQueryKeys.lists() })
    queryClient.invalidateQueries({ queryKey: spraayPreflightQueryKey })
    if (id) {
      queryClient.invalidateQueries({ queryKey: spraayBatchesQueryKeys.detail(id) })
    }
  }
}

export const usePrepareSpraayBatch = (
  id: string,
  options?: UseMutationOptions<InferClientOutput<typeof spraay.batches.$batchId.prepare.mutate>, ClientError, void>
) => {
  const invalidate = useInvalidateBatch()

  return useMutation({
    mutationFn: () => spraay.batches.$batchId.prepare.mutate({ $batchId: id }),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate(id)
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useSignSpraayBatch = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof spraay.batches.$batchId.sign.mutate>,
    ClientError,
    { signed_transaction: string }
  >
) => {
  const invalidate = useInvalidateBatch()

  return useMutation({
    mutationFn: (payload) => spraay.batches.$batchId.sign.mutate({ $batchId: id, ...payload }),
    ...options,
    // The batch can move to BROADCASTING or FAILED even when the request errors.
    onSettled: (data, error, variables, context) => {
      invalidate(id)
      options?.onSettled?.(data, error, variables, context)
    },
  })
}

export const useCancelSpraayBatch = (
  options?: UseMutationOptions<InferClientOutput<typeof spraay.batches.$batchId.cancel.mutate>, ClientError, string>
) => {
  const invalidate = useInvalidateBatch()

  return useMutation({
    mutationFn: (id) => spraay.batches.$batchId.cancel.mutate({ $batchId: id }),
    ...options,
    onSuccess: (data, id, context) => {
      invalidate(id)
      options?.onSuccess?.(data, id, context)
    },
  })
}

export const useTriggerSpraayAggregation = (
  options?: UseMutationOptions<InferClientOutput<typeof spraay.trigger.mutate>, ClientError, void>
) => {
  const invalidate = useInvalidateBatch()

  return useMutation({
    mutationFn: () => spraay.trigger.mutate(),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate(data.batch_id)
      options?.onSuccess?.(data, variables, context)
    },
  })
}
