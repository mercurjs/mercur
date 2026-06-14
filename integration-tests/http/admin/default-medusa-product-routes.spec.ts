import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../helpers/create-admin-user"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer, dbConnection }) => {
    describe("Admin default Medusa product routes", () => {
      let container: MedusaContainer

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      it("blocks Medusa's default admin product-variants route", async () => {
        const response = await api
          .get("/admin/product-variants", adminHeaders)
          .catch((error) => error.response)

        expect(response?.status).toBe(404)
        expect(response?.data).toEqual({ message: "Not found" })
      })
    })
  },
})
