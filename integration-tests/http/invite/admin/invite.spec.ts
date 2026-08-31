import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const SUPER_ADMIN_ROLE_ID = "role_super_admin"

const listInviteRoles = async (
    container: MedusaContainer,
    inviteId: string
): Promise<string[]> => {
    const link: any = container.resolve(ContainerRegistrationKeys.LINK)
    const linkService = link.getLinkModule(
        Modules.USER,
        "invite_id",
        Modules.RBAC,
        "rbac_role_id"
    )

    const links = await linkService.list({ invite_id: inviteId })

    return links.map((entry: any) => entry.rbac_role_id)
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Admin - Invites", () => {
            let appContainer: MedusaContainer

            beforeAll(() => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const { user } = await createAdminUser(
                    null,
                    adminHeaders,
                    appContainer
                )

                // `/admin/rbac/roles/assignable` reads the actor's roles from
                // the user <> role link rather than from the JWT, so link the
                // seeded super admin role the way `medusa user` does.
                const link: any = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.USER]: { user_id: user.id },
                    [Modules.RBAC]: { rbac_role_id: SUPER_ADMIN_ROLE_ID },
                })
            })

            // The panel only renders the roles field when the `rbac` flag is
            // reported as enabled, so `withMercur` forcing it on has to be
            // visible here.
            it("reports the rbac feature flag as enabled", async () => {
                const response = await api.get(
                    "/admin/feature-flags",
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.feature_flags.rbac).toBe(true)
            })

            it("lists the roles an admin is allowed to assign", async () => {
                const response = await api.get(
                    "/admin/rbac/roles/assignable",
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.roles.map((role: any) => role.id)).toContain(
                    SUPER_ADMIN_ROLE_ID
                )
            })

            it("links the roles the invite was created with", async () => {
                const response = await api.post(
                    "/admin/invites",
                    {
                        email: "with-roles@test.com",
                        roles: [SUPER_ADMIN_ROLE_ID],
                    },
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                expect(
                    await listInviteRoles(appContainer, response.data.invite.id)
                ).toEqual([SUPER_ADMIN_ROLE_ID])
            })

            it("lets an admin invited with a role use policy-guarded routes", async () => {
                const email = "invited@test.com"
                const password = "somepassword"

                const {
                    data: { invite },
                } = await api.post(
                    "/admin/invites",
                    { email, roles: [SUPER_ADMIN_ROLE_ID] },
                    adminHeaders
                )

                const {
                    data: { token: registrationToken },
                } = await api.post("/auth/user/emailpass/register", {
                    email,
                    password,
                })

                const acceptResponse = await api.post(
                    `/admin/invites/accept?token=${invite.token}`,
                    { email, first_name: "Invited", last_name: "Admin" },
                    { headers: { authorization: `Bearer ${registrationToken}` } }
                )

                expect(acceptResponse.status).toEqual(200)

                const {
                    data: { token: sessionToken },
                } = await api.post("/auth/user/emailpass", { email, password })

                // `/admin/stores` declares policies, so it 403s for an actor
                // whose role list is empty.
                const storesResponse = await api.get("/admin/stores", {
                    headers: { authorization: `Bearer ${sessionToken}` },
                })

                expect(storesResponse.status).toEqual(200)
            })
        })
    },
})
