import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const CURRENCIES_QUERY_KEY = "currencies" as const
const currenciesQueryKeys = queryKeysFactory(CURRENCIES_QUERY_KEY)

export const useCurrencies = (
  query?: InferClientInput<typeof sdk.admin.currencies.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.currencies.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.currencies.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.currencies.query({ ...query }),
    queryKey: currenciesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCurrency = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.currencies.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.currencies.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.currencies.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: currenciesQueryKeys.detail(id),
    queryFn: () => sdk.admin.currencies.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}
