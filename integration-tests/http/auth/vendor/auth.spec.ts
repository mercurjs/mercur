import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { env } from "../../../env"

jest.setTimeout(50000)


const adminHeaders = {
    headers: { "x-medusa-access-token": "test_token" },
}

medusaIntegrationTestRunner({
    env,
    testSuite: ({ dbConnection, getContainer, api }) => {
        describe("Regions - Admin", () => {
            let appContainer

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {

            })

            it("should throw an error", async () => {
                const created = await api.post(
                    `/admin/regions`,
                    {
                        name: "Test Region",
                        currency_code: "usd",
                        countries: ["us", "ca"],
                        metadata: { foo: "bar" },
                    },
                    adminHeaders
                )

                expect(created.status).toEqual(200)
            })
        })
    },
})