import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  addProductAttributesToProductWorkflow,
  applyProductAttributeChangeActionsWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  deleteProductAttributesWorkflow,
  removeProductAttributesFromProductWorkflow,
  updateProductAttributesOnProductWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

/**
 * Admin product-attribute coverage. Consolidates:
 *  - catalog CRUD endpoints (`/admin/product-attributes`)
 *  - the SPEC-014 §H confirm-time apply dispatcher
 *  - the SPEC-014 §G exclusive (product-scoped) axis update branch
 *  - the in-use / required deletion & removal guards
 *  - in-place rename of free-form text/unit values on a product
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    let appContainer: MedusaContainer

    beforeAll(() => {
      appContainer = getContainer()
    })

    const createProduct = async (title: string) => {
      const { result } = await createProductsWorkflow(appContainer).run({
        input: { products: [{ title, status: "published" }], created_by: "admin_user" },
      })
      return (result as { id: string }[])[0].id
    }

    /**
     * Catalog CRUD: `handle` is auto-generated (via `toHandle`) on BOTH the
     * attribute and its values for global attributes, explicit handles are
     * respected, toggle attributes seed `true`/`false` values, and the value
     * sub-routes work.
     */
    describe("Admin - product attributes (catalog CRUD)", () => {
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
        expect(attr.handle).toBe("color")
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
        expect([200, 201]).toContain(res.status)
        const attrId = res.data.product_attribute.id

        // Toggle values are seeded once at create, but the API strips the
        // `values` relation off non-select attributes, so assert the seeding at
        // the data layer (the value entity is not stripped).
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute_value",
          fields: ["name"],
          filters: { attribute_id: attrId },
        })
        const names = (data ?? []).map((v: { name: string }) => v.name).sort()
        expect(names).toEqual(["false", "true"])
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
        expect(byName.Silk).toBeTruthy()
        expect(byName.Silk.handle).toBe("silk")
        expect(byName["Linen Deluxe"]).toBeTruthy()
        expect(byName["Linen Deluxe"].id).toBe(linenId)
        expect(byName.Linen).toBeUndefined()
      })

      it("values upsert: mirrors late-added values onto the global variant-axis option", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const created = await api.post(
          "/admin/product-attributes",
          {
            name: "Weight",
            type: "multi_select",
            is_variant_axis: true,
            values: [{ name: "1g" }],
          },
          adminHeaders,
        )
        const attrId = created.data.product_attribute.id

        const optionValues = async () => {
          const {
            data: [attr],
          } = await query.graph({
            entity: "product_attribute",
            fields: ["product_option_id"],
            filters: { id: attrId },
          })
          const { data } = await query.graph({
            entity: "product_option",
            fields: ["values.value"],
            filters: { id: attr.product_option_id },
          })
          return ((data?.[0]?.values ?? []) as { value: string }[]).map(
            (v) => v.value,
          )
        }

        expect(await optionValues()).toEqual(expect.arrayContaining(["1g"]))

        await api.post(
          `/admin/product-attributes/${attrId}/values`,
          { values: [{ name: "100g" }, { name: "250g" }] },
          adminHeaders,
        )

        expect(await optionValues()).toEqual(
          expect.arrayContaining(["1g", "100g", "250g"]),
        )
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

        const updated = await api.post(
          `/admin/product-attributes/${attrId}/values/${goldId}`,
          { name: "Rose Gold" },
          adminHeaders,
        )
        expect(
          valuesByName(updated.data.product_attribute)["Rose Gold"],
        ).toBeTruthy()

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

    /**
     * SPEC-014 §H: the confirm-time apply dispatcher uses the native-option
     * model (axis → mirror option attach/detach; non-axis → value links),
     * matching the direct batch engine. This is the vendor approval-queue apply
     * path.
     */
    describe("SPEC-014 applyProductAttributeChangeActionsWorkflow", () => {
      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select"
        is_variant_axis?: boolean
        values: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: opts.values.map((name, rank) => ({ name, rank })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "values.id", "values.name"],
          filters: { id },
        })
        const byName = new Map<string, string>(
          (data[0].values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id, byName }
      }

      it("applies add then remove actions on the native-option model", async () => {
        const color = await createAttr({
          name: "Color",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const material = await createAttr({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const productId = await createProduct("Change Product")
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { id: color.id, value_ids: [color.byName.get("Red")!] },
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            ],
            remove: [],
            update: [],
          },
        })

        // Axis attachment is read from the ProductOption side (the
        // `product.options` populate is broken on the 2.16 preview build).
        const optionAttached = async (title: string) => {
          const { data } = await query.graph({
            entity: "product_option",
            fields: ["id", "title", "products.id"],
            filters: { title },
          })
          return (data ?? []).some(
            (o: { title: string; products?: { id: string }[] }) =>
              o.title === title &&
              (o.products ?? []).some((p) => p.id === productId),
          )
        }
        const valueNames = async () => {
          const { data } = await query.graph({
            entity: "product",
            fields: ["id", "product_attribute_values.name"],
            filters: { id: productId },
          })
          return ((data[0].product_attribute_values ?? []) as {
            name: string
          }[]).map((v) => v.name)
        }

        expect(await optionAttached("Color")).toBe(true)
        expect(await valueNames()).toContain("Cotton")
        expect(await valueNames()).toContain("Red")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [],
            remove: [color.id],
            update: [],
          },
        })

        expect(await optionAttached("Color")).toBe(false)
        expect(await valueNames()).not.toContain("Red")
        expect(await valueNames()).toContain("Cotton")
      })
    })

    /**
     * SPEC-014 §G update branch — exclusive (product-scoped) axis value
     * mutation. An inline axis attribute (`product_id` set, mirroring a native
     * exclusive `product_option`) must support deleting/adding/renaming its own
     * values via the batch `update` action.
     */
    describe("SPEC-014 updateProductAttributesOnProductWorkflow exclusive axis", () => {
      const scopedSizeAttr = async (productId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name", "product_id", "values.id", "values.name"],
          filters: { product_id: productId },
        })
        const attr = (data ?? []).find(
          (a: { name: string }) => a.name === "Size",
        )
        const byName = new Map<string, string>(
          ((attr?.values ?? []) as { id: string; name: string }[]).map((v) => [
            v.name,
            v.id,
          ]),
        )
        return { id: attr?.id as string, byName }
      }

      const attributeValueExists = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id"],
          filters: { id },
        })
        return (data ?? []).length > 0
      }

      const remainingValueNames = async (productId: string) => {
        const { byName } = await scopedSizeAttr(productId)
        return Array.from(byName.keys()).sort()
      }

      const optionValues = async (title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "values.value"],
          filters: { title },
        })
        return ((data?.[0]?.values ?? []) as { value: string }[])
          .map((v) => v.value)
          .sort()
      }

      const attributeName = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name"],
          filters: { id },
        })
        return (data?.[0] as { name?: string } | undefined)?.name
      }

      it("removes a value from an exclusive (product-scoped) axis", async () => {
        const productId = await createProduct("Exclusive Axis Remove")
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { title: "Size", values: ["S", "M", "L"], is_variant_axis: true },
            ],
          },
        })

        const size = await scopedSizeAttr(productId)
        expect(size.id).toBeTruthy()
        const sValueId = size.byName.get("S")!
        expect(sValueId).toBeTruthy()

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: size.id, remove: [sValueId] }],
          },
        })

        expect(await attributeValueExists(sValueId)).toBe(false)
        expect(await remainingValueNames(productId)).toEqual(["L", "M"])
        expect(await optionValues("Size")).toEqual(["L", "M"])
      })

      it("adds a value to an exclusive (product-scoped) axis", async () => {
        const productId = await createProduct("Exclusive Axis Add")
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
          },
        })

        const size = await scopedSizeAttr(productId)

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: size.id, add: [{ value: "XL" }] }],
          },
        })

        expect(await remainingValueNames(productId)).toEqual(["M", "S", "XL"])
        expect(await optionValues("Size")).toEqual(["M", "S", "XL"])
      })

      it("renames an exclusive (product-scoped) axis + syncs the mirror option title", async () => {
        const productId = await createProduct("Exclusive Axis Rename")
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
          },
        })

        const size = await scopedSizeAttr(productId)

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [{ id: size.id, title: "Sizing", add: [{ value: "L" }] }],
          },
        })

        expect(await attributeName(size.id)).toEqual("Sizing")
        expect(await optionValues("Sizing")).toEqual(["L", "M", "S"])
      })

      it("renames a product-scoped non-axis (text) attribute and swaps its value", async () => {
        const productId = await createProduct("Scoped Text Rename")
        await addProductAttributesToProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ title: "Care", type: "text", value: "Hand wash" }],
          },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "name"],
          filters: { product_id: productId },
        })
        const care = (data ?? []).find(
          (a: { name: string }) => a.name === "Care",
        ) as { id: string }
        expect(care?.id).toBeTruthy()

        await updateProductAttributesOnProductWorkflow(appContainer).run({
          input: {
            product_id: productId,
            update: [
              { id: care.id, title: "Care Instructions", value: "Machine wash" },
            ],
          },
        })

        expect(await attributeName(care.id)).toEqual("Care Instructions")
      })
    })

    /**
     * Guards:
     *  - deleteProductAttributesWorkflow refuses to delete an attribute whose
     *    values are selected on any product (in-use guard).
     *  - removeProductAttributesFromProductWorkflow refuses to detach a required
     *    attribute from a product.
     */
    describe("product-attribute deletion/removal guards", () => {
      const createAttr = async (opts: {
        name: string
        type?: "multi_select" | "single_select"
        is_required?: boolean
        values: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type ?? "single_select",
                is_required: opts.is_required ?? false,
                values: opts.values.map((name, rank) => ({ name, rank })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "values.id", "values.name"],
          filters: { id },
        })
        const byName = new Map<string, string>(
          (data[0].values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id, byName }
      }

      const expectRejects = async (
        promise: Promise<unknown>,
        pattern: RegExp,
      ) => {
        let message: string | undefined
        try {
          await promise
        } catch (e) {
          message = (e as Error).message
        }
        expect(message).toBeDefined()
        expect(message).toMatch(pattern)
      }

      const attributeExists = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id"],
          filters: { id },
        })
        return (data ?? []).length > 0
      }

      it("blocks deleting an attribute whose value is selected on a product", async () => {
        const material = await createAttr({
          name: "Guard Material",
          values: ["Cotton", "Wool"],
        })
        const productId = await createProduct("Guard Delete Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            ],
            remove: [],
            update: [],
          },
        })

        await expectRejects(
          deleteProductAttributesWorkflow(appContainer).run({
            input: { ids: [material.id] },
          }),
          /in use/i,
        )

        expect(await attributeExists(material.id)).toBe(true)
      })

      it("allows deleting an attribute not linked to any product", async () => {
        const unused = await createAttr({
          name: "Guard Unused",
          values: ["A", "B"],
        })

        await deleteProductAttributesWorkflow(appContainer).run({
          input: { ids: [unused.id] },
        })

        expect(await attributeExists(unused.id)).toBe(false)
      })

      it("blocks removing a required attribute from a product", async () => {
        const required = await createAttr({
          name: "Guard Required",
          is_required: true,
          values: ["X", "Y"],
        })
        const productId = await createProduct("Guard Required Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ id: required.id, value_ids: [required.byName.get("X")!] }],
            remove: [],
            update: [],
          },
        })

        await expectRejects(
          removeProductAttributesFromProductWorkflow(appContainer).run({
            input: { product_id: productId, remove: [required.id] },
          }),
          /required/i,
        )
      })

      it("allows removing a non-required attribute from a product", async () => {
        const optional = await createAttr({
          name: "Guard Optional",
          values: ["M", "N"],
        })
        const productId = await createProduct("Guard Optional Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ id: optional.id, value_ids: [optional.byName.get("M")!] }],
            remove: [],
            update: [],
          },
        })

        await removeProductAttributesFromProductWorkflow(appContainer).run({
          input: { product_id: productId, remove: [optional.id] },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "product_attribute_values.name"],
          filters: { id: productId },
        })
        const names = ((data[0].product_attribute_values ?? []) as {
          name: string
        }[]).map((v) => v.name)
        expect(names).not.toContain("M")
      })
    })

    /**
     * Editing a text/unit attribute value on a product must rename the existing
     * (1:1, product-owned) value in place — not create a new value and orphan
     * the old one.
     */
    describe("update text/unit attribute value in place", () => {
      const createAttr = async (name: string, type: "text" | "unit") => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: { attributes: [{ name, type, values: [] }] },
        })
        return result[0].id
      }

      const linkedValues = async (productId: string, attrId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: [
            "id",
            "product_attribute_values.id",
            "product_attribute_values.name",
            "product_attribute_values.attribute.id",
          ],
          filters: { id: productId },
        })
        return ((data[0]?.product_attribute_values ?? []) as {
          id: string
          name: string
          attribute?: { id: string }
        }[]).filter((v) => v.attribute?.id === attrId)
      }

      // Count value rows directly: the module service strips the `values`
      // relation off non-select attributes, so product_attribute.values is
      // always empty for text/unit.
      const totalValues = async (attrId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute_value",
          fields: ["id"],
          filters: { attribute_id: attrId },
        })
        return (data ?? []).length
      }

      it.each(["text", "unit"] as const)(
        "renames the existing %s value in place without orphaning",
        async (type) => {
          const attrId = await createAttr(`In-place ${type}`, type)
          const productId = await createProduct(`In-place ${type} product`)

          await applyProductAttributeChangeActionsWorkflow(appContainer).run({
            input: {
              product_id: productId,
              add: [{ id: attrId, value: "100cm" }],
              remove: [],
              update: [],
            },
          })

          const before = await linkedValues(productId, attrId)
          expect(before).toHaveLength(1)
          expect(before[0].name).toBe("100cm")
          expect(await totalValues(attrId)).toBe(1)
          const originalValueId = before[0].id

          await updateProductAttributesOnProductWorkflow(appContainer).run({
            input: {
              product_id: productId,
              update: [{ id: attrId, value: "200cm" }],
            },
          })

          const after = await linkedValues(productId, attrId)
          expect(after).toHaveLength(1)
          expect(after[0].id).toBe(originalValueId)
          expect(after[0].name).toBe("200cm")
          expect(await totalValues(attrId)).toBe(1)
        },
      )
    })
  },
})
