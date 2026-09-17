import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerDefaultsWorkflow } from "@mercurjs/core/workflows"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Stores", () => {
      let appContainer: MedusaContainer
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createSellerDefaultsWorkflow(appContainer).run()

        const result = await createSellerUser(appContainer, {
          email: "seller@test.com",
          name: "Seller Store",
        })
        headers = result.headers
      })

      it("rejects anonymous requests", async () => {
        const error = await api
          .get("/vendor/stores")
          .catch((e) => e)

        expect(error.response.status).toBe(401)
      })

      it("returns stores for an authenticated member", async () => {
        const response = await api.get("/vendor/stores", headers)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.stores)).toBe(true)
      })

      it("returns the store's supported currencies by default", async () => {
        const storeModule = appContainer.resolve(Modules.STORE)
        const [store] = await storeModule.listStores()
        await storeModule.updateStores(store.id, {
          supported_currencies: [
            { currency_code: "usd", is_default: true },
            { currency_code: "eur" },
          ],
        })

        const response = await api.get("/vendor/stores", headers)

        expect(response.status).toBe(200)
        const codes = response.data.stores[0].supported_currencies.map(
          (c: { currency_code: string }) => c.currency_code
        )
        expect(codes).toEqual(expect.arrayContaining(["usd", "eur"]))
        expect(
          response.data.stores[0].supported_currencies[0].currency
        ).toBeDefined()
      })

      it("returns stores for a member without a seller", async () => {
        const registerResponse = await api.post(
          "/auth/member/emailpass/register",
          { email: `onboarding-${Date.now()}@test.com`, password: "somepassword" }
        )

        const response = await api.get("/vendor/stores", {
          headers: {
            authorization: `Bearer ${registerResponse.data.token}`,
          },
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.stores)).toBe(true)
      })

      it("strips disallowed relations from expanded fields", async () => {
        const response = await api.get(
          "/vendor/stores?fields=%2Bmembers.*",
          headers
        )

        expect(response.status).toBe(200)
        for (const store of response.data.stores) {
          expect(store.members).toBeUndefined()
        }
      })

      it("rejects ordering by a field outside the allowed list", async () => {
        const error = await api
          .get("/vendor/stores?order=members.id", headers)
          .catch((e) => e)

        expect(error.response.status).toBe(400)
      })
    })
  },
})
