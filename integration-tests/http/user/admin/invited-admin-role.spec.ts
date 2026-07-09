import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

import assignAdminSuperAdminRoleHandler from "@mercurjs/core/subscribers/assign-admin-super-admin-role"

jest.setTimeout(60_000)

const SUPER_ADMIN_ROLE_ID = "role_super_admin"

const rolesOf = async (container: MedusaContainer, userId: string) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "user",
    fields: ["id", "rbac_roles.id"],
    filters: { id: userId },
  })
  return (data?.[0]?.rbac_roles ?? []).map((r: { id: string }) => r.id)
}

const runHandler = (container: MedusaContainer, userId: string) =>
  assignAdminSuperAdminRoleHandler({
    event: { data: { id: userId } },
    container,
  } as never)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Invited admin gets the super-admin role", () => {
      let container: MedusaContainer

      beforeAll(async () => {
        container = getContainer()
      })

      it("assigns role_super_admin to a role-less admin user", async () => {
        const userModule = container.resolve(Modules.USER)
        const user = await userModule.createUsers({
          email: `invited-${Date.now()}@medusa.js`,
          first_name: "Invited",
          last_name: "Admin",
        })

        expect(await rolesOf(container, user.id)).toHaveLength(0)

        await runHandler(container, user.id)

        expect(await rolesOf(container, user.id)).toContain(
          SUPER_ADMIN_ROLE_ID
        )
      })

      it("leaves an admin that already has a role untouched", async () => {
        const userModule = container.resolve(Modules.USER)
        const rbac: any = container.resolve(Modules.RBAC)
        const link = container.resolve(ContainerRegistrationKeys.LINK)

        const user = await userModule.createUsers({
          email: `scoped-${Date.now()}@medusa.js`,
          first_name: "Scoped",
          last_name: "Admin",
        })
        const role = await rbac.createRbacRoles({ name: "Scoped Admin" })
        await link.create({
          [Modules.USER]: { user_id: user.id },
          [Modules.RBAC]: { rbac_role_id: role.id },
        })

        await runHandler(container, user.id)

        const roles = await rolesOf(container, user.id)
        expect(roles).toEqual([role.id])
        expect(roles).not.toContain(SUPER_ADMIN_ROLE_ID)
      })
    })
  },
})
