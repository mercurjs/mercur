import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const OFFER_CONDITIONS_QUERY_KEY = "offer_conditions" as const
export const offerConditionsQueryKeys = queryKeysFactory(
  OFFER_CONDITIONS_QUERY_KEY
)

export const useOfferConditions = (
  query?: InferClientInput<typeof sdk.vendor.offerConditions.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof sdk.vendor.offerConditions.query>
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.offerConditions.query({ ...query }),
    queryKey: offerConditionsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}
