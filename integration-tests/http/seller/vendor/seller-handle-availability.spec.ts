import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("GET /vendor/sellers/handle-availability", () => {
      let appContainer: MedusaContainer
      let unregisteredHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createSellerUser(appContainer, {
          email: "taken@test.com",
          name: "Taken Store",
        })

        const { data } = await api.post(`/auth/member/emailpass/register`, {
          email: `onboarding-${Date.now()}@test.com`,
          password: "somepassword",
        })

        unregisteredHeaders = {
          headers: { authorization: `Bearer ${data.token}` },
        }
      })

      it("reports a free handle as available for a member without a seller", async () => {
        const response = await api.get(
          `/vendor/sellers/handle-availability?handle=brand-new-store`,
          unregisteredHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({
          handle: "brand-new-store",
          available: true,
        })
      })

      it("reports a handle used by an existing seller as taken", async () => {
        const response = await api.get(
          `/vendor/sellers/handle-availability?handle=taken-store`,
          unregisteredHeaders
        )

        expect(response.data).toEqual({
          handle: "taken-store",
          available: false,
          reason: "taken",
        })
      })

      it("reports a handle that is not URL safe as invalid", async () => {
        const response = await api.get(
          `/vendor/sellers/handle-availability?handle=Not%20Valid`,
          unregisteredHeaders
        )

        expect(response.data).toEqual({
          handle: "Not Valid",
          available: false,
          reason: "invalid",
        })
      })

      it("frees the handle of a soft-deleted seller", async () => {
        const sellerService = appContainer.resolve(MercurModules.SELLER)
        const [seller] = await sellerService.listSellers({
          handle: "taken-store",
        })
        await sellerService.softDeleteSellers([seller.id])

        const response = await api.get(
          `/vendor/sellers/handle-availability?handle=taken-store`,
          unregisteredHeaders
        )

        expect(response.data.available).toEqual(true)
      })

      it("rejects a missing handle", async () => {
        const error = await api
          .get(`/vendor/sellers/handle-availability`, unregisteredHeaders)
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
      })

      it("rejects unauthenticated requests", async () => {
        const error = await api
          .get(`/vendor/sellers/handle-availability?handle=anything`)
          .catch((e) => e)

        expect(error.response.status).toEqual(401)
      })
    })
  },
})
