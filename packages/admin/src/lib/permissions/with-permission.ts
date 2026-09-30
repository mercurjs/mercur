import type { Permission } from "@mercurjs/dashboard-sdk"
import { createWithPermission } from "@mercurjs/dashboard-shared"

import { meQueryOptions } from "../../hooks/api/users"
import { queryClient } from "../query-client"

export const withPermission = createWithPermission(async () => {
  const { user } = await queryClient.ensureQueryData(meQueryOptions())

  return user?.permissions ?? null
})

type LoaderModule = { loader?: (args: never) => unknown }

/**
 * For `lazy: () => import("./page").then(withLoaderPermission("x:view"))`,
 * where the page module carries its own `loader` export.
 */
export const withLoaderPermission =
  (permission: Permission | Permission[]) =>
  <TModule extends LoaderModule>(module: TModule): TModule =>
    module.loader
      ? { ...module, loader: withPermission(module.loader, permission) }
      : module
