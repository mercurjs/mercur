import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
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

      it("does not expand fields outside the allowed list", async () => {
        const response = await api
          .get("/vendor/stores?fields=%2Bmembers.*", headers)
          .catch((e) => e.response)

        if (response.status === 200) {
          for (const store of response.data.stores) {
            expect(store.members).toBeUndefined()
          }
        } else {
          expect(response.status).toBe(400)
        }
      })
    })
  },
})
