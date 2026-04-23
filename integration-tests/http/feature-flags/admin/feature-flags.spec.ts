import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
    adminHeaders,
    createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Feature Flags (default values)", () => {
            let appContainer: MedusaContainer

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            describe("FEATURE_FLAG_ROUTER registration (T003)", () => {
                it("registers admin_warehouse_management with default value false", () => {
                    const router = appContainer.resolve(
                        ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
                    ) as any

                    expect(
                        router.isFeatureEnabled("admin_warehouse_management")
                    ).toBe(false)
                })

                it("keeps seller_registration flag registered alongside the new flag", () => {
                    const router = appContainer.resolve(
                        ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
                    ) as any

                    const flags = router.listFlags() as Array<{
                        key: string
                        value: boolean
                    }>
                    const keys = flags.map((f) => f.key)

                    expect(keys).toContain("admin_warehouse_management")
                    expect(keys).toContain("seller_registration")
                })
            })

            describe("GET /admin/feature-flags (T005)", () => {
                it("returns 200 with admin_warehouse_management default false", async () => {
                    const response = await api.get(
                        "/admin/feature-flags",
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toHaveProperty("feature_flags")
                    expect(
                        response.data.feature_flags.admin_warehouse_management
                    ).toEqual(false)
                })

                it("lists seller_registration alongside admin_warehouse_management", async () => {
                    const response = await api.get(
                        "/admin/feature-flags",
                        adminHeaders
                    )

                    expect(response.data.feature_flags).toHaveProperty(
                        "admin_warehouse_management"
                    )
                    expect(response.data.feature_flags).toHaveProperty(
                        "seller_registration"
                    )
                })

                it("rejects unauthenticated requests with 401", async () => {
                    const response = await api
                        .get("/admin/feature-flags")
                        .catch((e) => e.response)

                    expect(response.status).toEqual(401)
                })
            })
        })
    },
})
