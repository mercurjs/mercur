import { ClientError, InferClientOutput } from "@mercurjs/client";
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";

type VendorMePermissionsResponse = InferClientOutput<
  typeof sdk.vendor.rbac.me.permissions.query
>;

const ME_PERMISSIONS_QUERY_KEY = ["vendor_rbac_me_permissions"] as const;

export const mePermissionsQueryKey = ME_PERMISSIONS_QUERY_KEY;

/**
 * The acting member's permissions for the seller currently being acted on.
 *
 * Scoped per seller, so it has to be refetched when the store switcher changes
 * stores — the `x-seller-id` header decides which membership the API resolves.
 */
export const useMePermissions = (
  options?: Omit<
    UseQueryOptions<
      VendorMePermissionsResponse,
      ClientError,
      VendorMePermissionsResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryFn: () => sdk.vendor.rbac.me.permissions.query(),
    queryKey: mePermissionsQueryKey,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
