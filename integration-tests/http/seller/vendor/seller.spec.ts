import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser, vendorHeaders } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Seller", () => {
            let appContainer: MedusaContainer
            let seller: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer)
                seller = result.seller
            })

            it("should get current seller", async () => {
                const response = await api.get(
                    `/vendor/sellers/me`,
                    vendorHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.seller).toEqual(
                    expect.objectContaining({
                        id: seller.id,
                        name: "Test Seller",
                    })
                )
            })

            it("should update seller data", async () => {
                const updateData = {
                    name: "Updated Seller Name",
                    phone: "+1234567890",
                    address_1: "123 Main Street",
                    city: "New York",
                    country_code: "US",
                    postal_code: "10001",
                }

                const response = await api.post(
                    `/vendor/sellers/me`,
                    updateData,
                    vendorHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.seller).toEqual(
                    expect.objectContaining({
                        id: seller.id,
                        name: "Updated Seller Name",
                        phone: "+1234567890",
                        address_1: "123 Main Street",
                        city: "New York",
                        country_code: "US",
                        postal_code: "10001",
                    })
                )
            })

            it("should partially update seller data", async () => {
                const response = await api.post(
                    `/vendor/sellers/me`,
                    {
                        phone: "+9876543210",
                    },
                    vendorHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.seller).toEqual(
                    expect.objectContaining({
                        id: seller.id,
                        name: "Test Seller",
                        phone: "+9876543210",
                    })
                )
            })
        })
    },
})
