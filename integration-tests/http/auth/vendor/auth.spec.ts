import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { env } from "../../../env"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)


const adminHeaders = {
    headers: { "x-medusa-access-token": "test_token" },
}

medusaIntegrationTestRunner({
    env,
    testSuite: ({ dbConnection, getContainer, api }) => {
        describe("Vendor - Auth", () => {
            let appContainer

            beforeAll(async () => {
                appContainer = getContainer()
                console.log(appContainer.registrations)
            })

            beforeEach(async () => {
                await createSellerUser(appContainer)
            })

            it("should get the seller", async () => {
                const result = await api.get(
                    `/vendor/sellers/me`,
                )

                expect(result.status).toEqual(200)
            })
        })
    },
})