import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { SellerRole } from "@mercurjs/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

const PRIVATE_FIELDS =
  "id,name,payment_details.*,professional_details.*,member_invites.*,members.*,*payout_account,*payout_account.onboarding"

const PRIVATE_KEYS = [
  "payment_details",
  "professional_details",
  "member_invites",
  "members",
  "payout_account",
]

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Seller private fields", () => {
      let appContainer: MedusaContainer
      let seller: any
      let sellerHeaders: any
      let storeHeaders: Record<string, Record<string, string>>

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const result = await createSellerUser(appContainer, {
          email: "private-fields@test.com",
          name: "Private Fields Store",
        })
        seller = result.seller
        sellerHeaders = result.headers

        await api.post(`/admin/sellers/${seller.id}/approve`, {}, adminHeaders)

        await api.post(
          `/vendor/sellers/${seller.id}/payment-details`,
          { holder_name: "Secret Holder", iban: "DE89370400440532013000" },
          sellerHeaders
        )
        await api.post(
          `/vendor/sellers/${seller.id}/professional-details`,
          { corporate_name: "Secret Corp", tax_id: "TAX-123" },
          sellerHeaders
        )
        await api.post(
          `/vendor/sellers/${seller.id}/members`,
          { email: "invitee@test.com", role_id: SellerRole.SUPPORT },
          sellerHeaders
        )

        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      it("never resolves private relations on the seller list", async () => {
        const response = await api.get(
          `/store/sellers?fields=${encodeURIComponent(PRIVATE_FIELDS)}`,
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const listed = response.data.sellers.find((s: any) => s.id === seller.id)
        expect(listed).toBeDefined()
        expect(listed.name).toEqual("Private Fields Store")
        for (const key of PRIVATE_KEYS) {
          expect(listed[key]).toBeUndefined()
        }
        expect(JSON.stringify(response.data)).not.toContain("Secret")
        expect(JSON.stringify(response.data)).not.toContain("invitee@test.com")
      })

      it("never resolves private relations on the seller detail", async () => {
        const response = await api.get(
          `/store/sellers/${seller.id}?fields=${encodeURIComponent(PRIVATE_FIELDS)}`,
          storeHeaders
        )

        expect(response.status).toEqual(200)
        for (const key of PRIVATE_KEYS) {
          expect(response.data.seller[key]).toBeUndefined()
        }
        expect(JSON.stringify(response.data)).not.toContain("Secret")
      })

      it("drops private relations added on top of the defaults", async () => {
        const response = await api.get(
          `/store/sellers/${seller.id}?fields=${encodeURIComponent(
            "+payment_details.iban,+member_invites.token,+members.email"
          )}`,
          storeHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.seller.handle).toBeDefined()
        for (const key of PRIVATE_KEYS) {
          expect(response.data.seller[key]).toBeUndefined()
        }
      })

      it("keeps payment and professional details off GET /vendor/sellers/me", async () => {
        const me = await api.get(`/vendor/sellers/me`, sellerHeaders)
        expect(me.status).toEqual(200)
        expect(me.data.seller.id).toEqual(seller.id)
        expect(me.data.seller.payment_details).toBeUndefined()
        expect(me.data.seller.professional_details).toBeUndefined()

        const detail = await api.get(`/vendor/sellers/${seller.id}`, sellerHeaders)
        expect(detail.status).toEqual(200)
        expect(detail.data.seller.payment_details.holder_name).toEqual("Secret Holder")
        expect(detail.data.seller.professional_details.corporate_name).toEqual("Secret Corp")
      })
    })
  },
})
