import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

/**
 * Admin product-attribute catalog CRUD endpoints (`/admin/product-attributes`).
 * Focus: `handle` is auto-generated (via `toHandle`) on BOTH the attribute and
 * its values for global attributes, explicit handles are respected, toggle
 * attributes seed `true`/`false` values, and the value sub-routes work.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - product attributes (catalog CRUD)", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const valuesByName = (attr: any) =>
        Object.fromEntries(
          (attr.values ?? []).map((v: any) => [v.name, v]),
        ) as Record<string, { id: string; name: string; handle: string }>

      it("create: generates a handle on the attribute and on every value", async () => {
        const res = await api.post(
          "/admin/product-attributes",
          {
            name: "Color",
            type: "multi_select",
            is_variant_axis: true,
            values: [{ name: "Red" }, { name: "Blue" }],
          },
          adminHeaders,
        )

        expect([200, 201]).toContain(res.status)
        const attr = res.data.product_attribute
        // attribute handle = toHandle(name)
        expect(attr.handle).toBe("color")
        // each value handle = toHandle(value name)
        const byName = valuesByName(attr)
        expect(byName.Red.handle).toBe("red")
        expect(byName.Blue.handle).toBe("blue")
      })

      it("create: kebab-cases multi-word names into handles", async () => {
        const res = await api.post(
          "/admin/product-attributes",
          {
            name: "Multi Select",
            type: "multi_select",
            values: [{ name: "Value One" }],
          },
          adminHeaders,
        )

        const attr = res.data.product_attribute
        expect(attr.handle).toBe("multi-select")
        expect(valuesByName(attr)["Value One"].handle).toBe("value-one")
      })

      it("create: respects an explicit handle on attribute and value", async () => {
        const res = await api.post(
          "/admin/product-attributes",
          {
            name: "Material",
            type: "single_select",
            handle: "custom-material",
            values: [{ name: "Cotton", handle: "ctn" }],
          },
          adminHeaders,
        )

        const attr = res.data.product_attribute
        expect(attr.handle).toBe("custom-material")
        expect(valuesByName(attr).Cotton.handle).toBe("ctn")
      })

      it("create: toggle seeds true/false values, each with a handle", async () => {
        const res = await api.post(
          "/admin/product-attributes",
          { name: "Waterproof", type: "toggle" },
          adminHeaders,
        )

        const attr = res.data.product_attribute
        const byName = valuesByName(attr)
        expect(Object.keys(byName).sort()).toEqual(["false", "true"])
        expect(byName.true.handle).toBe("true")
        expect(byName.false.handle).toBe("false")
      })

      it("values upsert: creates new values (with handle) and updates by id", async () => {
        const created = await api.post(
          "/admin/product-attributes",
          {
            name: "Fabric",
            type: "single_select",
            values: [{ name: "Linen" }],
          },
          adminHeaders,
        )
        const attrId = created.data.product_attribute.id
        const linenId = valuesByName(created.data.product_attribute).Linen.id

        const res = await api.post(
          `/admin/product-attributes/${attrId}/values`,
          {
            values: [{ name: "Silk" }, { id: linenId, name: "Linen Deluxe" }],
          },
          adminHeaders,
        )

        const byName = valuesByName(res.data.product_attribute)
        // new value created with an auto handle
        expect(byName.Silk).toBeTruthy()
        expect(byName.Silk.handle).toBe("silk")
        // existing value updated in place (by id)
        expect(byName["Linen Deluxe"]).toBeTruthy()
        expect(byName["Linen Deluxe"].id).toBe(linenId)
        expect(byName.Linen).toBeUndefined()
      })

      it("value update + delete sub-routes", async () => {
        const created = await api.post(
          "/admin/product-attributes",
          {
            name: "Trim",
            type: "single_select",
            values: [{ name: "Gold" }, { name: "Silver" }],
          },
          adminHeaders,
        )
        const attrId = created.data.product_attribute.id
        const goldId = valuesByName(created.data.product_attribute).Gold.id

        // update a single value by id
        const updated = await api.post(
          `/admin/product-attributes/${attrId}/values/${goldId}`,
          { name: "Rose Gold" },
          adminHeaders,
        )
        expect(valuesByName(updated.data.product_attribute)["Rose Gold"]).toBeTruthy()

        // delete a single value by id
        const deleted = await api.delete(
          `/admin/product-attributes/${attrId}/values/${goldId}`,
          adminHeaders,
        )
        const names = (deleted.data.product_attribute.values ?? []).map(
          (v: any) => v.name,
        )
        expect(names).not.toContain("Rose Gold")
        expect(names).toContain("Silver")
      })

      it("list: returns global attributes only (hides product-scoped)", async () => {
        await api.post(
          "/admin/product-attributes",
          {
            name: "Pattern",
            type: "single_select",
            values: [{ name: "Plain" }],
          },
          adminHeaders,
        )

        const res = await api.get("/admin/product-attributes", adminHeaders)
        expect(res.status).toBe(200)
        expect(
          res.data.product_attributes.some((a: any) => a.name === "Pattern"),
        ).toBe(true)
        // every returned attribute is global (no product_id)
        expect(
          res.data.product_attributes.every((a: any) => !a.product_id),
        ).toBe(true)
      })

      it("retrieve + update; rejects a type change", async () => {
        const created = await api.post(
          "/admin/product-attributes",
          {
            name: "Finish",
            type: "single_select",
            values: [{ name: "Matte" }],
          },
          adminHeaders,
        )
        const id = created.data.product_attribute.id

        const got = await api.get(
          `/admin/product-attributes/${id}`,
          adminHeaders,
        )
        expect(got.data.product_attribute.name).toBe("Finish")

        const upd = await api.post(
          `/admin/product-attributes/${id}`,
          { name: "Surface Finish", is_required: true },
          adminHeaders,
        )
        expect(upd.data.product_attribute.name).toBe("Surface Finish")
        expect(upd.data.product_attribute.is_required).toBe(true)

        // `type` is immutable once created.
        const err = await api
          .post(
            `/admin/product-attributes/${id}`,
            { type: "text" },
            adminHeaders,
          )
          .catch((e) => e)
        expect(err.response.status).toBe(400)
      })

      it("delete: removes the attribute (subsequent GET 404s)", async () => {
        const created = await api.post(
          "/admin/product-attributes",
          {
            name: "Season",
            type: "single_select",
            values: [{ name: "Summer" }],
          },
          adminHeaders,
        )
        const id = created.data.product_attribute.id

        const del = await api.delete(
          `/admin/product-attributes/${id}`,
          adminHeaders,
        )
        expect(del.status).toBe(200)
        expect(del.data.deleted).toBe(true)

        const err = await api
          .get(`/admin/product-attributes/${id}`, adminHeaders)
          .catch((e) => e)
        expect(err.response.status).toBe(404)
      })
    })
  },
})
