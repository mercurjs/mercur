import { IAuthModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

jest.setTimeout(90000)

/**
 * Deliberately does not use `createAdminUser`: that helper always seeds a
 * wildcard role, which is exactly what these cases need to vary.
 */
const createAdminWithRoles = async (
  container: MedusaContainer,
  dbConnection: any,
  { email, roleIds }: { email: string; roleIds: string[] }
) => {
  const [user] = await dbConnection.raw(
    `INSERT INTO "user" (id, email, first_name, last_name)
     VALUES (?, ?, 'Test', 'User') RETURNING id`,
    [`user_${email.replace(/[^a-z0-9]/gi, "")}`, email]
  ).then((r: any) => r.rows ?? r)

  const authModule: IAuthModuleService = container.resolve(Modules.AUTH)
  const passwordHash = await Scrypt.kdf("somepassword", {
    logN: 4,
    r: 8,
    p: 1,
  })

  const authIdentity = await authModule.createAuthIdentities({
    provider_identities: [
      {
        provider: "emailpass",
        entity_id: email,
        provider_metadata: { password: passwordHash.toString("base64") },
      },
    ],
    app_metadata: { user_id: user.id },
  })

  const config = container.resolve("configModule") as any
  const { jwtSecret, jwtOptions } = config.projectConfig.http

  const token = jwt.sign(
    {
      actor_id: user.id,
      actor_type: "user",
      auth_identity_id: authIdentity.id,
      app_metadata: { roles: roleIds },
    },
    jwtSecret,
    { expiresIn: "1d", ...jwtOptions }
  )

  return { user, headers: { headers: { authorization: `Bearer ${token}` } } }
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("RBAC - admin route policies", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      describe("an admin with no roles at all", () => {
        // Route policy checks reject an actor with an empty role list. Every
        // admin predating RBAC has no role, so without the super-admin
        // fallback the whole admin API would 403 on upgrade.
        it("is not locked out", async () => {
          const { headers } = await createAdminWithRoles(
            appContainer,
            dbConnection,
            { email: "noroles@test.com", roleIds: [] }
          )

          const response = await api.get("/admin/sellers", headers)
          expect(response.status).toEqual(200)
        })
      })

      describe("an admin holding a narrow role", () => {
        it("is limited to that role's policies", async () => {
          const rbac: any = appContainer.resolve(Modules.RBAC)

          // `seller:read` is registered in code and synced into rbac_policy on
          // boot, so look it up rather than creating a duplicate.
          const [policy] = await rbac.listRbacPolicies({ key: "seller:read" })
          expect(policy).toBeDefined()

          const role = await rbac.createRbacRoles({ name: "Seller Reader" })
          await rbac.createRbacRolePolicies({
            role_id: role.id,
            policy_id: policy.id,
          })

          const { headers } = await createAdminWithRoles(
            appContainer,
            dbConnection,
            { email: "sellerreader@test.com", roleIds: [role.id] }
          )

          const allowed = await api.get("/admin/sellers", headers)
          expect(allowed.status).toEqual(200)

          const denied = await api
            .get("/admin/payouts", headers)
            .catch((e) => e.response)
          expect(denied.status).toEqual(403)
        })
      })
    })
  },
})
