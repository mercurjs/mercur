import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor Products — Mercur wrappers", () => {
      let container: MedusaContainer
      let seller1Headers: { headers: Record<string, string> }
      let seller2Headers: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "v1@test.com",
          name: "Vendor One",
        })
        seller1Headers = a.headers
        const b = await createSellerUser(container, {
          email: "v2@test.com",
          name: "Vendor Two",
        })
        seller2Headers = b.headers
      })

      describe("POST /vendor/products", () => {
        it("creates a product and links the seller (manage_inventory=false)", async () => {
          const res = await api.post(
            `/vendor/products`,
            { title: "Vendor Product" },
            seller1Headers
          )

          expect(res.status).toBe(201)
          expect(res.data.product.title).toBe("Vendor Product")
          for (const v of res.data.product.variants ?? []) {
            expect(v.manage_inventory).toBe(false)
          }
        })

        it("inline variant axes -> stock options", async () => {
          const res = await api.post(
            `/vendor/products`,
            {
              title: "Vendor T-Shirt",
              variant_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["S", "M"],
                },
              ],
              variants: [
                { title: "Small", options: { Size: "S" } },
                { title: "Medium", options: { Size: "M" } },
              ],
            },
            seller1Headers
          )

          expect(res.status).toBe(201)
          const sizeOption = res.data.product.options.find(
            (o: any) => o.title === "Size"
          )
          expect(sizeOption).toBeDefined()
          expect(sizeOption.values.map((v: any) => v.value).sort()).toEqual([
            "M",
            "S",
          ])
        })
      })

      describe("GET /vendor/products", () => {
        it("lists own products and excludes other vendors' proposed products", async () => {
          await api.post(
            `/vendor/products`,
            { title: "Seller 1 Proposed" },
            seller1Headers
          )
          await api.post(
            `/vendor/products`,
            { title: "Seller 2 Proposed" },
            seller2Headers
          )

          const res = await api.get(`/vendor/products`, seller1Headers)
          expect(res.status).toBe(200)
          const titles = res.data.products.map((p: any) => p.title)
          expect(titles).toContain("Seller 1 Proposed")
          expect(titles).not.toContain("Seller 2 Proposed")
        })
      })

      describe("POST /vendor/products/:id", () => {
        it("seller updates own product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Own" },
            seller1Headers
          )
          const id = create.data.product.id

          const res = await api.post(
            `/vendor/products/${id}`,
            { title: "Updated" },
            seller1Headers
          )
          expect(res.status).toBe(200)
          expect(res.data.product.title).toBe("Updated")
        })

        it("seller cannot update another seller's product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Seller 1 Owned" },
            seller1Headers
          )
          const id = create.data.product.id

          await expect(
            api.post(
              `/vendor/products/${id}`,
              { title: "hack" },
              seller2Headers
            )
          ).rejects.toMatchObject({ response: { status: 404 } })
        })
      })

      describe("DELETE /vendor/products/:id", () => {
        it("seller deletes own product", async () => {
          const create = await api.post(
            `/vendor/products`,
            { title: "Will Delete" },
            seller1Headers
          )
          const id = create.data.product.id

          const res = await api.delete(`/vendor/products/${id}`, seller1Headers)
          expect(res.status).toBe(200)
          expect(res.data.deleted).toBe(true)
        })
      })

      describe("POST /vendor/products/:id/variants", () => {
        it("seller adds a variant pinned to manage_inventory=false", async () => {
          const create = await api.post(
            `/vendor/products`,
            {
              title: "Has Variants",
              options: [{ title: "Color", values: ["Red"] }],
              variants: [{ title: "Red", options: { Color: "Red" } }],
            },
            seller1Headers
          )
          const id = create.data.product.id

          const res = await api.post(
            `/vendor/products/${id}/variants`,
            {
              title: "Red 2",
              manage_inventory: true,
              options: { Color: "Red" },
            } as any,
            seller1Headers
          )

          expect(res.status).toBe(201)
          const added = res.data.product.variants.find(
            (v: any) => v.title === "Red 2"
          )
          expect(added).toBeDefined()
          expect(added.manage_inventory).toBe(false)
        })
      })
    })
  },
})
