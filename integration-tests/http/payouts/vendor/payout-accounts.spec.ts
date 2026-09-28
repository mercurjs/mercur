import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { PayoutAccountStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Payout Accounts", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: Awaited<ReturnType<typeof createSellerUser>>["headers"]

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const result = await createSellerUser(appContainer, {
          email: "payout-account-seller@test.com",
          name: "Payout Account Seller",
        })
        sellerHeaders = result.headers
      })

      describe("POST /vendor/payout-accounts", () => {
        it("should create a payout account when data is omitted", async () => {
          const response = await api.post(
            "/vendor/payout-accounts",
            { context: { country: "DE" } },
            sellerHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.payout_account).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              status: PayoutAccountStatus.ACTIVE,
              data: {},
            })
          )
        })

        it("should create a payout account with an empty body", async () => {
          const response = await api.post(
            "/vendor/payout-accounts",
            {},
            sellerHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.payout_account.id).toEqual(expect.any(String))
        })
      })
    })
  },
})
