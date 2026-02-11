import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { sdk, fetchQuery } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const FULFILLMENT_PROVIDERS_QUERY_KEY = "fulfillment_providers" as const;
export const fulfillmentProvidersQueryKeys = queryKeysFactory(
  FULFILLMENT_PROVIDERS_QUERY_KEY
);

const FULFILLMENT_PROVIDER_OPTIONS_QUERY_KEY =
  "fulfillment_provider_options" as const;
export const fulfillmentProviderOptionsQueryKeys = queryKeysFactory(
  FULFILLMENT_PROVIDER_OPTIONS_QUERY_KEY
);

export const useFulfillmentProviders = (
  query?: InferClientInput<typeof sdk.vendor.fulfillmentProviders.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.fulfillmentProviders.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.fulfillmentProviders.query({ ...query }),
    queryKey: fulfillmentProvidersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useFulfillmentProviderOptions = (
  providerId: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.fulfillmentProviders.$id.options.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => {
      if (!providerId) {
        throw new Error("providerId is required for useFulfillmentProviderOptions")
      }
      return fetchQuery(`/vendor/fulfillment-providers/${providerId}/options`, {
        method: "GET",
      })
    },
    queryKey: fulfillmentProviderOptionsQueryKeys.list(providerId),
    ...options,
    enabled: !!providerId && (options?.enabled !== undefined ? options.enabled : true),
  });

  return { ...data, ...rest };
};
