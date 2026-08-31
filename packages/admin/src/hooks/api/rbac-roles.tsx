import { HttpTypes } from "@medusajs/types"
import { ClientError } from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"

const ME_PERMISSIONS_QUERY_KEY = ["rbac_me_permissions"] as const

export const mePermissionsQueryKey = ME_PERMISSIONS_QUERY_KEY

export const useMePermissions = (
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminRbacMePermissionsResponse,
      ClientError,
      HttpTypes.AdminRbacMePermissionsResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryFn: () =>
      sdk.admin.rbac.me.permissions.query(
        {} as never
      ) as unknown as Promise<HttpTypes.AdminRbacMePermissionsResponse>,
    queryKey: mePermissionsQueryKey,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

const ASSIGNABLE_ROLES_QUERY_KEY = ["rbac_assignable_roles"] as const

export const assignableRolesQueryKey = ASSIGNABLE_ROLES_QUERY_KEY

/**
 * Fetches the roles the authenticated actor is allowed to assign.
 */
export const useRbacAssignableRoles = (
  query?: HttpTypes.AdminRbacRoleListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminRbacAssignableRolesListResponse,
      ClientError,
      HttpTypes.AdminRbacAssignableRolesListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryFn: () =>
      sdk.admin.rbac.roles.assignable.query({
        ...query,
      } as never) as unknown as Promise<HttpTypes.AdminRbacAssignableRolesListResponse>,
    queryKey: [...ASSIGNABLE_ROLES_QUERY_KEY, query],
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
