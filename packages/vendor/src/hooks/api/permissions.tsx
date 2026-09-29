import { ClientError } from "@mercurjs/client";
import type { PermissionMap } from "@mercurjs/dashboard-sdk";
import { useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";

export const permissionsQueryKey = (sellerId?: string) =>
  ["vendor_permissions", sellerId] as const;

/**
 * The acting member's rights in the selected seller. `null` means the API
 * returned no `permissions` field, i.e. no access-control module is enforcing.
 */
export const useCurrentPermissions = (sellerId?: string) => {
  return useQuery<PermissionMap | null, ClientError>({
    queryKey: permissionsQueryKey(sellerId),
    queryFn: async () => {
      const { seller } = await sdk.vendor.sellers.me.query({
        fields: "+permissions",
      });
      return seller.permissions ?? null;
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });
};
