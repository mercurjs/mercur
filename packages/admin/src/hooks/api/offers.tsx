import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const OFFERS_QUERY_KEY = "offers" as const
export const offerQueryKeys = queryKeysFactory(OFFERS_QUERY_KEY)

export const useOffers = (
  query?: InferClientInput<typeof sdk.admin.offers.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.offers.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.offers.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.offers.query({ ...query }),
    queryKey: offerQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOffer = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.offers.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.offers.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.offers.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.offers.$id.query({ $id: id, ...query }),
    queryKey: offerQueryKeys.detail(id, query),
    enabled: !!id,
    ...options,
  })

  return { ...data, ...rest }
}
