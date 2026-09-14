import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const SHIPPING_PROFILE_QUERY_KEY = "shipping_profile" as const;
export const shippingProfileQueryKeys = queryKeysFactory(
  SHIPPING_PROFILE_QUERY_KEY
);

export const useShippingProfile = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.shippingProfiles.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingProfiles.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingProfiles.$id.query({ $id: id, ...query }),
    queryKey: shippingProfileQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useShippingProfiles = (
  query?: InferClientInput<typeof sdk.vendor.shippingProfiles.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingProfiles.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingProfiles.query({ ...query }),
    queryKey: shippingProfileQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};
