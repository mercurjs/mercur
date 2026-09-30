import type { Permission, PermissionMap } from "@mercurjs/dashboard-sdk"
import { permissionMapAllows } from "./permission-check"

type Loader<TArgs, TResult> = (args: TArgs) => TResult | Promise<TResult>

/**
 * Loaders run before `RoutePermissionGuard` (an element) gets to refuse the
 * route, so a loader has to check the permission itself. A denied loader
 * resolves to `null`. The return type stays the loader's own because the guard
 * renders Access Denied instead of the page, so nothing ever reads that value.
 *
 * @example
 * ```ts
 * export const withPermission = createWithPermission(async () => {
 *   const { user } = await queryClient.ensureQueryData(meQueryOptions())
 *   return user.permissions ?? null
 * })
 *
 * export const loader = withPermission(productLoader, "products:view")
 * ```
 */
export const createWithPermission =
  (getPermissions: () => Promise<PermissionMap | null | undefined>) =>
  <TArgs, TResult>(
    loader: Loader<TArgs, TResult>,
    permission: Permission | Permission[],
    options: { requireAll?: boolean } = {}
  ) =>
  async (args: TArgs): Promise<TResult> => {
    const permissions = await getPermissions().catch(() => null)

    if (!permissionMapAllows(permissions, permission, options.requireAll ?? true)) {
      return null as TResult
    }

    return loader(args)
  }
