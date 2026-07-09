import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  Modules,
  UserWorkflowEvents,
} from "@medusajs/framework/utils"

const SUPER_ADMIN_ROLE_ID = "role_super_admin"

/**
 * Grants the seeded super-admin role to admin users created without any role.
 *
 * With the `rbac` feature flag on (always the case under `withMercur`), Medusa
 * forbids any role-less admin from every policy-gated route — so an admin who
 * accepts an invite that carried no role lands on a 403 the moment the panel
 * boots. The seed CLI already assigns `role_super_admin` to the first admin;
 * this mirrors that for invited admins so the marketplace has no half-created
 * accounts that can authenticate but not use the panel.
 */
export default async function assignAdminSuperAdminRoleHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!FeatureFlag.isFeatureEnabled("rbac")) {
    return
  }

  const userId = event.data.id
  if (!userId) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "rbac_roles.id"],
    filters: { id: userId },
  })

  const user = users?.[0] as
    | { id: string; rbac_roles?: { id: string }[] | null }
    | undefined

  if (!user || user.rbac_roles?.length) {
    return
  }

  const rbacService = container.resolve(Modules.RBAC)
  const [superAdminRole] = await rbacService.listRbacRoles({
    id: SUPER_ADMIN_ROLE_ID,
  })

  if (!superAdminRole) {
    return
  }

  await link.create({
    [Modules.USER]: { user_id: user.id },
    [Modules.RBAC]: { rbac_role_id: superAdminRole.id },
  })
}

export const config: SubscriberConfig = {
  event: UserWorkflowEvents.CREATED,
  context: {
    subscriberId: "assign-admin-super-admin-role-handler",
  },
}
