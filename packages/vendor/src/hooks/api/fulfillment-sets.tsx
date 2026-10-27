import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { UseQueryOptions, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const FULFILLMENT_SETS_QUERY_KEY = "fulfillment_sets" as const
export const fulfillmentSetsQueryKeys = queryKeysFactory(
  FULFILLMENT_SETS_QUERY_KEY
)

export const useFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query>,
    "$id" | "$zoneId"
  >,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query>
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query({
        $id: fulfillmentSetId,
        $zoneId: serviceZoneId,
        ...query,
      }),
    queryKey: fulfillmentSetsQueryKeys.detail(fulfillmentSetId, query),
    ...options,
  })

  return { ...data, ...rest }
}
