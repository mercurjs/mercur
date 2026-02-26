import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const PAYOUTS_QUERY_KEY = "payouts" as const
export const payoutsQueryKeys = queryKeysFactory(PAYOUTS_QUERY_KEY)

export const usePayout = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.payouts.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.payouts.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.payouts.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.payouts.$id.query({ $id: id, ...query }),
    queryKey: payoutsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const usePayouts = (
  query?: InferClientInput<typeof sdk.admin.payouts.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.payouts.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.payouts.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.payouts.query({ ...query }),
    queryKey: payoutsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}
