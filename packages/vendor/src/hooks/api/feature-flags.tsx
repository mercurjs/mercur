import { ClientError, InferClientOutput } from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const FEATURE_FLAGS_QUERY_KEY = "feature_flags" as const;
export const featureFlagsQueryKeys =
  queryKeysFactory(FEATURE_FLAGS_QUERY_KEY);

export const useFeatureFlags = (
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.featureFlags.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.featureFlags.query(),
    queryKey: featureFlagsQueryKeys.lists(),
    ...options,
  });

  return { ...data, ...rest };
};
