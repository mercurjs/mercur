import {
  ClientError,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, useQuery, UseQueryOptions } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const FEATURE_FLAGS_QUERY_KEY = "feature_flags" as const
export const featureFlagsQueryKeys = queryKeysFactory(FEATURE_FLAGS_QUERY_KEY)

type FeatureFlagsResponse = InferClientOutput<typeof sdk.admin.featureFlags.query>

export const useFeatureFlags = (
  options?: Omit<
    UseQueryOptions<FeatureFlagsResponse, ClientError, FeatureFlagsResponse, QueryKey>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.featureFlags.query({}),
    queryKey: featureFlagsQueryKeys.all,
    staleTime: Infinity,
    ...options,
  })

  return { ...data, ...rest }
}

/**
 * Returns whether admin warehouse management is enabled for this deployment.
 * Baseline Mercur is seller-owned fulfillment — this flag opts in to
 * admin-managed fulfillment (FBA-style).
 *
 * See `specs/005-admin-warehouse-capability-lock`.
 */
export const useWarehouseManagement = (): boolean => {
  const { feature_flags } = useFeatureFlags()
  return Boolean(feature_flags?.admin_warehouse_management)
}
