// Must run before medusaIntegrationTestRunner bootstraps the container so
// registerFeatureFlag can pick up the env override during boot.
process.env.MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT = "true"

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
        describe("Admin - Feature Flags (env override)", () => {
            let appContainer: MedusaContainer

            beforeAll(async () => {
                appContainer = getContainer()
            })

            afterAll(() => {
                delete process.env.MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            it("resolves admin_warehouse_management to true when MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT=true", () => {
                const router = appContainer.resolve(
                    ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
                ) as any

                expect(
                    router.isFeatureEnabled("admin_warehouse_management")
                ).toBe(true)
            })

            it("surfaces the overridden value via GET /admin/feature-flags", async () => {
                const response = await api.get(
                    "/admin/feature-flags",
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                expect(
                    response.data.feature_flags.admin_warehouse_management
                ).toEqual(true)
            })
        })
    },
})
