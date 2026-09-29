import { ClientError } from "@mercurjs/client";
import type { PermissionMap } from "@mercurjs/dashboard-sdk";
import { useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";

export const permissionsQueryKey = ["admin_permissions"] as const;

/**
 * The acting user's rights. `null` means the API returned no `permissions`
 * field, i.e. no access-control module is enforcing.
 */
export const useCurrentPermissions = (options?: { enabled?: boolean }) => {
  return useQuery<PermissionMap | null, ClientError>({
    queryKey: permissionsQueryKey,
    queryFn: async () => {
      const { user } = await sdk.admin.users.me.query({
        fields: "+permissions",
      });
      return user.permissions ?? null;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
