import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { submitSellerProductsWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Products", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(
          dbConnection,
          adminHeaders,
          appContainer
        )
      })

      describe("POST /admin/products", () => {
        it("should create a product", async () => {
          const response = await api.post(
            `/admin/products`,
            { title: "Admin Test Product" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product).toBeDefined()
          expect(response.data.product.title).toEqual(
            "Admin Test Product"
          )
          expect(response.data.product.status).toEqual("proposed")
          expect(response.data.product.created_by_actor).toEqual(
            "admin"
          )
        })

        it("should create a product with brand and categories", async () => {
          const brandRes = await api.post(
            `/admin/product-brands`,
            { name: "Test Brand" },
            adminHeaders
          )
          const brandId = brandRes.data.product_brand.id

          const catRes = await api.post(
            `/admin/product-categories`,
            { name: "Test Category" },
            adminHeaders
          )
          const categoryId = catRes.data.product_category.id

          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Relations",
              brand_id: brandId,
              categories: [{ id: categoryId }],
            },
            adminHeaders
          ).catch(console.log)

          expect(response.status).toEqual(200)
          expect(response.data.product.brand_id).toEqual(brandId)
        })

        it("should create a product with variants", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Variants",
              variants: [
                { title: "Variant 1", sku: "ADMIN-SKU-001" },
                { title: "Variant 2", sku: "ADMIN-SKU-002" },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.variants).toHaveLength(2)
        })

        it("should create a product with inline custom attribute as variant axis", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Custom Variant Attr",
              variant_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["S", "M", "L"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes contains the new attribute
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.variant_attributes[0].name).toEqual("Size")
          expect(product.variant_attributes[0].is_variant_axis).toEqual(true)
          expect(product.variant_attributes[0].product_id).toEqual(product.id)

          // custom_attributes contains the same attribute (product-scoped)
          expect(product.custom_attributes).toHaveLength(1)
          expect(product.custom_attributes[0].id).toEqual(
            product.variant_attributes[0].id
          )

          // attribute_values contains all 3 values
          expect(product.attribute_values).toHaveLength(3)
          const valueNames = product.attribute_values.map(
            (v: any) => v.name
          )
          expect(valueNames).toContain("S")
          expect(valueNames).toContain("M")
          expect(valueNames).toContain("L")
        })

        it("should create a product with existing global multi_select attribute as variant axis", async () => {
          // Create a global attribute with values
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Color",
              type: "multi_select",
              is_variant_axis: true,
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          // Add values to the attribute
          const redRes = await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Red" }] },
            adminHeaders
          )
          const redId = redRes.data.product_attribute.values.find(
            (v: any) => v.name === "Red"
          ).id

          const blueRes = await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Blue" }] },
            adminHeaders
          )
          const blueId = blueRes.data.product_attribute.values.find(
            (v: any) => v.name === "Blue"
          ).id

          await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Green" }] },
            adminHeaders
          )

          // Create product referencing global attribute with selected values
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Global Variant Attr",
              variant_attributes: [
                {
                  attribute_id: attribute.id,
                  value_ids: [redId, blueId],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes has the global attribute
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.variant_attributes[0].id).toEqual(attribute.id)
          expect(product.variant_attributes[0].product_id).toBeNull()

          // custom_attributes is empty (global, not product-scoped)
          expect(product.custom_attributes).toHaveLength(0)

          // attribute_values contains only the selected values
          expect(product.attribute_values).toHaveLength(2)
          const valueIds = product.attribute_values.map(
            (v: any) => v.id
          )
          expect(valueIds).toContain(redId)
          expect(valueIds).toContain(blueId)
        })

        it("should create a product with existing text attribute and new values", async () => {
          // Create a global text attribute
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Care Instructions",
              type: "text",
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          // Create product with product_attributes referencing text attribute with new values
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Text Attr",
              product_attributes: [
                {
                  attribute_id: attribute.id,
                  values: ["Machine wash cold"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes is empty
          expect(product.variant_attributes).toHaveLength(0)

          // custom_attributes is empty (global attribute, not product-scoped)
          expect(product.custom_attributes).toHaveLength(0)

          // attribute_values contains the new value
          expect(product.attribute_values).toHaveLength(1)
          expect(product.attribute_values[0].name).toEqual(
            "Machine wash cold"
          )
          expect(product.attribute_values[0].attribute_id).toEqual(
            attribute.id
          )
        })

        it("should create a product with inline custom product_attribute (non-variant)", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Custom Product Attr",
              product_attributes: [
                {
                  name: "Material",
                  type: "single_select",
                  values: ["Cotton", "Polyester"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes is empty
          expect(product.variant_attributes).toHaveLength(0)

          // custom_attributes contains the new attribute (product-scoped)
          expect(product.custom_attributes).toHaveLength(1)
          expect(product.custom_attributes[0].name).toEqual("Material")
          expect(product.custom_attributes[0].product_id).toEqual(
            product.id
          )

          // attribute_values contains both values
          expect(product.attribute_values).toHaveLength(2)
          const valueNames = product.attribute_values.map(
            (v: any) => v.name
          )
          expect(valueNames).toContain("Cotton")
          expect(valueNames).toContain("Polyester")
        })

        it("should create a product with existing single_select attribute and selected value_ids", async () => {
          // Create a global single_select attribute with values
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Fit",
              type: "single_select",
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const slimRes = await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Slim" }] },
            adminHeaders
          )
          const slimId = slimRes.data.product_attribute.values.find(
            (v: any) => v.name === "Slim"
          ).id

          await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Regular" }] },
            adminHeaders
          )

          // Create product selecting only "Slim"
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Selected Value",
              product_attributes: [
                {
                  attribute_id: attribute.id,
                  value_ids: [slimId],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes empty
          expect(product.variant_attributes).toHaveLength(0)

          // custom_attributes empty
          expect(product.custom_attributes).toHaveLength(0)

          // attribute_values contains only selected value
          expect(product.attribute_values).toHaveLength(1)
          expect(product.attribute_values[0].id).toEqual(slimId)
        })

        it("should reject non-multi_select attribute as variant axis", async () => {
          const response = await api
            .post(
              `/admin/products`,
              {
                title: "Should Fail",
                variant_attributes: [
                  {
                    name: "Notes",
                    type: "text",
                    is_variant_axis: true,
                    values: ["x"],
                  },
                ],
              },
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject non-filterable type with is_filterable", async () => {
          const response = await api
            .post(
              `/admin/products`,
              {
                title: "Should Fail",
                variant_attributes: [
                  {
                    name: "Notes",
                    type: "text",
                    is_filterable: true,
                    values: ["x"],
                  },
                ],
              },
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid value_ids on existing attribute", async () => {
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Season",
              type: "multi_select",
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const response = await api
            .post(
              `/admin/products`,
              {
                title: "Should Fail",
                variant_attributes: [
                  {
                    attribute_id: attribute.id,
                    value_ids: ["pattrval_nonexistent"],
                  },
                ],
              },
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should create a product with both variant_attributes and product_attributes", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Both Attr Types",
              variant_attributes: [
                {
                  name: "Color",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["Red", "Blue"],
                },
              ],
              product_attributes: [
                {
                  name: "Weight",
                  type: "unit",
                  values: ["500g"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // variant_attributes has Color
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.variant_attributes[0].name).toEqual("Color")

          // custom_attributes has both (both product-scoped)
          expect(product.custom_attributes).toHaveLength(2)
          const customNames = product.custom_attributes.map(
            (a: any) => a.name
          )
          expect(customNames).toContain("Color")
          expect(customNames).toContain("Weight")

          // attribute_values contains all values from both
          expect(product.attribute_values).toHaveLength(3)
          const valueNames = product.attribute_values.map(
            (v: any) => v.name
          )
          expect(valueNames).toContain("Red")
          expect(valueNames).toContain("Blue")
          expect(valueNames).toContain("500g")
        })

        it("should create a product with variants referencing attribute values", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Variant Attr Values",
              variant_attributes: [
                {
                  name: "Color",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["Red", "Blue"],
                },
              ],
              variants: [
                {
                  title: "Red Variant",
                  attribute_values: { Color: "Red" },
                },
                {
                  title: "Blue Variant",
                  attribute_values: { Color: "Blue" },
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          expect(product.variants).toHaveLength(2)

          const redVariant = product.variants.find(
            (v: any) => v.title === "Red Variant"
          )
          expect(redVariant.attribute_values).toHaveLength(1)
          expect(redVariant.attribute_values[0].name).toEqual("Red")

          const blueVariant = product.variants.find(
            (v: any) => v.title === "Blue Variant"
          )
          expect(blueVariant.attribute_values).toHaveLength(1)
          expect(blueVariant.attribute_values[0].name).toEqual("Blue")
        })

        it("should not duplicate values when adding existing attribute with already existing value names", async () => {
          // Create a global single_select attribute with a pre-existing value
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Fabric",
              type: "single_select",
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          // Pre-create a value via the values endpoint
          await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Silk" }] },
            adminHeaders
          )

          // Create product referencing same value by name
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Existing Value",
              product_attributes: [
                {
                  attribute_id: attribute.id,
                  values: ["Silk"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product

          // attribute_values contains the existing value (not a duplicate)
          expect(product.attribute_values).toHaveLength(1)
          expect(product.attribute_values[0].name).toEqual("Silk")

          // Verify the attribute still only has one "Silk" value
          const attrCheck = await api.get(
            `/admin/product-attributes/${attribute.id}`,
            adminHeaders
          )
          const silkValues =
            attrCheck.data.product_attribute.values.filter(
              (v: any) => v.name === "Silk"
            )
          expect(silkValues).toHaveLength(1)
        })
      })

      describe("POST /admin/products/:id (update with attributes)", () => {
        it("should add inline custom variant attribute to existing product", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Update Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              variant_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["S", "M", "L"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.variant_attributes[0].name).toEqual("Size")
          expect(product.attribute_values).toHaveLength(3)
        })

        it("should add existing global attribute via update", async () => {
          // Create global attribute with values
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Color",
              type: "multi_select",
              is_variant_axis: true,
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const valRes = await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Red" }, { name: "Blue" }] },
            adminHeaders
          )
          const redId = valRes.data.product_attribute.values.find(
            (v: any) => v.name === "Red"
          ).id
          const blueId = valRes.data.product_attribute.values.find(
            (v: any) => v.name === "Blue"
          ).id

          // Create product then update with the attribute
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Update Global Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              variant_attributes: [
                {
                  attribute_id: attribute.id,
                  value_ids: [redId, blueId],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.variant_attributes[0].id).toEqual(attribute.id)
          expect(product.attribute_values).toHaveLength(2)
        })

        it("should add inline product_attributes via update", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Update Product Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              product_attributes: [
                {
                  name: "Material",
                  type: "single_select",
                  values: ["Cotton", "Polyester"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product
          expect(product.custom_attributes).toHaveLength(1)
          expect(product.custom_attributes[0].name).toEqual("Material")
          expect(product.attribute_values).toHaveLength(2)
        })

        it("should add variants with attribute_values via update", async () => {
          // Create product with variant attribute
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Update Variants Attr Product",
              variant_attributes: [
                {
                  name: "Color",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["Red", "Blue"],
                },
              ],
            },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          // Update: add variants referencing the attribute values
          const response = await api.post(
            `/admin/products/${productId}`,
            {
              variants: [
                {
                  title: "Red Variant",
                  attribute_values: { Color: "Red" },
                },
                {
                  title: "Blue Variant",
                  attribute_values: { Color: "Blue" },
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product
          expect(product.variants).toHaveLength(2)

          const redVariant = product.variants.find(
            (v: any) => v.title === "Red Variant"
          )
          expect(redVariant.attribute_values).toHaveLength(1)
          expect(redVariant.attribute_values[0].name).toEqual("Red")

          const blueVariant = product.variants.find(
            (v: any) => v.title === "Blue Variant"
          )
          expect(blueVariant.attribute_values).toHaveLength(1)
          expect(blueVariant.attribute_values[0].name).toEqual("Blue")
        })

        it("should update with existing text attribute and new values via product_attributes", async () => {
          // Create global text attribute
          const attrRes = await api.post(
            `/admin/product-attributes`,
            { name: "Care", type: "text" },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const prodRes = await api.post(
            `/admin/products`,
            { title: "Update Text Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              product_attributes: [
                {
                  attribute_id: attribute.id,
                  values: ["Dry clean only"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const product = response.data.product
          expect(product.attribute_values).toHaveLength(1)
          expect(product.attribute_values[0].name).toEqual(
            "Dry clean only"
          )
          expect(product.attribute_values[0].attribute_id).toEqual(
            attribute.id
          )
        })
      })

      describe("POST /admin/products/:id/attributes/batch", () => {
        it("should batch-add existing select attribute with selected value_ids", async () => {
          // Create product
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Batch Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          // Create global attribute with values
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: "Color",
              type: "multi_select",
              is_variant_axis: true,
            },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const valRes = await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Red" }, { name: "Blue" }, { name: "Green" }] },
            adminHeaders
          )
          const redId = valRes.data.product_attribute.values.find(
            (v: any) => v.name === "Red"
          ).id
          const blueId = valRes.data.product_attribute.values.find(
            (v: any) => v.name === "Blue"
          ).id

          // Batch add
          const response = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: attribute.id,
                  attribute_value_ids: [redId, blueId],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created).toHaveLength(1)
          expect(response.data.created[0].id).toEqual(attribute.id)

          // Verify product has the attribute linked
          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          const product = productRes.data.product
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.attribute_values).toHaveLength(2)
        })

        it("should batch-add text attribute with new values", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Batch Text Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const attrRes = await api.post(
            `/admin/product-attributes`,
            { name: "Description", type: "text" },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          const response = await api.post(
            `/admin/products/${productId}/attributes/batch`,
            {
              create: [
                {
                  attribute_id: attribute.id,
                  values: ["Handmade cotton fabric"],
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)

          // Verify product has the new value linked
          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          const product = productRes.data.product
          expect(product.variant_attributes).toHaveLength(1)
          expect(product.attribute_values).toHaveLength(1)
          expect(product.attribute_values[0].name).toEqual(
            "Handmade cotton fabric"
          )
        })

        it("should batch-add and delete attributes simultaneously", async () => {
          // Create product with an inline custom attribute
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Batch Add Delete Product",
              variant_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["S", "M"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const sizeAttrId = product.variant_attributes[0].id

          // Create another global attribute
          const attrRes = await api.post(
            `/admin/product-attributes`,
            { name: "Material", type: "single_select" },
            adminHeaders
          )
          const materialAttr = attrRes.data.product_attribute

          await api.post(
            `/admin/product-attributes/${materialAttr.id}/values`,
            { values: [{ name: "Cotton" }] },
            adminHeaders
          )

          // Batch: add Material, delete Size
          const response = await api.post(
            `/admin/products/${product.id}/attributes/batch`,
            {
              create: [{ attribute_id: materialAttr.id }],
              delete: [sizeAttrId],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created).toHaveLength(1)
          expect(response.data.deleted.ids).toContain(sizeAttrId)

          // Verify product state
          const updatedRes = await api.get(
            `/admin/products/${product.id}`,
            adminHeaders
          )
          const updated = updatedRes.data.product
          expect(
            updated.variant_attributes.some(
              (a: any) => a.id === sizeAttrId
            )
          ).toBe(false)
          expect(
            updated.variant_attributes.some(
              (a: any) => a.id === materialAttr.id
            )
          ).toBe(true)
        })

        it("should reject batch-add of product-scoped attribute", async () => {
          // Create product with a product-scoped attribute
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Scoped Attr Source",
              product_attributes: [
                { name: "Custom Field", type: "text", values: ["val"] },
              ],
            },
            adminHeaders
          )
          const scopedAttrId =
            prodRes.data.product.custom_attributes[0].id

          // Create another product
          const prod2Res = await api.post(
            `/admin/products`,
            { title: "Scoped Attr Target" },
            adminHeaders
          )

          // Try to link the product-scoped attribute to another product
          const response = await api
            .post(
              `/admin/products/${prod2Res.data.product.id}/attributes/batch`,
              {
                create: [{ attribute_id: scopedAttrId }],
              },
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("DELETE /admin/products/:id/attributes/:attribute_id", () => {
        it("should remove a global attribute from product", async () => {
          // Create global attribute
          const attrRes = await api.post(
            `/admin/product-attributes`,
            { name: "Season", type: "single_select" },
            adminHeaders
          )
          const attribute = attrRes.data.product_attribute

          await api.post(
            `/admin/product-attributes/${attribute.id}/values`,
            { values: [{ name: "Summer" }] },
            adminHeaders
          )

          // Create product and link the attribute
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Remove Global Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          await api.post(
            `/admin/products/${productId}/attributes/batch`,
            { create: [{ attribute_id: attribute.id }] },
            adminHeaders
          )

          // Delete the attribute from the product
          const response = await api.delete(
            `/admin/products/${productId}/attributes/${attribute.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual(attribute.id)
          expect(response.data.deleted).toEqual(true)

          // Verify product no longer has the attribute
          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(productRes.data.product.variant_attributes).toHaveLength(0)
          expect(productRes.data.product.attribute_values).toHaveLength(0)

          // Global attribute still exists
          const attrCheck = await api.get(
            `/admin/product-attributes/${attribute.id}`,
            adminHeaders
          )
          expect(attrCheck.status).toEqual(200)
        })

        it("should soft-delete a product-scoped attribute", async () => {
          // Create product with inline custom attribute
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Remove Scoped Attr Product",
              product_attributes: [
                {
                  name: "Custom Note",
                  type: "text",
                  values: ["Some note"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const scopedAttrId = product.custom_attributes[0].id

          // Delete the product-scoped attribute
          const response = await api.delete(
            `/admin/products/${product.id}/attributes/${scopedAttrId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.deleted).toEqual(true)

          // Verify product no longer has it
          const updatedRes = await api.get(
            `/admin/products/${product.id}`,
            adminHeaders
          )
          expect(updatedRes.data.product.custom_attributes).toHaveLength(0)
          expect(updatedRes.data.product.attribute_values).toHaveLength(0)

          // Attribute is soft-deleted (404 on retrieve)
          const attrCheck = await api
            .get(
              `/admin/product-attributes/${scopedAttrId}`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(attrCheck.status).toEqual(404)
        })

        it("should reject removing variant axis attribute when variants use it", async () => {
          // Create product with variant axis + variants referencing it
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Reject Remove Axis Product",
              variant_attributes: [
                {
                  name: "Color",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["Red", "Blue"],
                },
              ],
              variants: [
                {
                  title: "Red Variant",
                  attribute_values: { Color: "Red" },
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const colorAttrId = product.variant_attributes[0].id

          // Try to remove the variant axis attribute
          const response = await api
            .delete(
              `/admin/products/${product.id}/attributes/${colorAttrId}`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should allow removing variant axis attribute when no variants use it", async () => {
          // Create product with variant axis but no variants
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Allow Remove Axis Product",
              variant_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  is_variant_axis: true,
                  values: ["S", "M"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const sizeAttrId = product.variant_attributes[0].id

          const response = await api.delete(
            `/admin/products/${product.id}/attributes/${sizeAttrId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.deleted).toEqual(true)

          // Verify product no longer has the attribute
          const updatedRes = await api.get(
            `/admin/products/${product.id}`,
            adminHeaders
          )
          expect(updatedRes.data.product.variant_attributes).toHaveLength(0)
        })
      })

      describe("Product Attributes sub-resource (/admin/products/:id/attributes)", () => {
        it("should create a product-scoped attribute via POST", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Sub-resource Attr Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              name: "Custom Field",
              type: "text",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute).toBeDefined()
          expect(response.data.product_attribute.name).toEqual(
            "Custom Field"
          )
          expect(response.data.product_attribute.type).toEqual("text")
          expect(response.data.product_attribute.product_id).toEqual(
            productId
          )
        })

        it("should create a product-scoped attribute with inline values", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "Sub-resource Values Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}/attributes`,
            {
              name: "Finish",
              type: "single_select",
              values: [
                { name: "Matte" },
                { name: "Glossy" },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const attr = response.data.product_attribute
          expect(attr.name).toEqual("Finish")
          expect(attr.product_id).toEqual(productId)
          expect(attr.values).toHaveLength(2)
          const valueNames = attr.values.map((v: any) => v.name)
          expect(valueNames).toContain("Matte")
          expect(valueNames).toContain("Glossy")
        })

        it("should list product-scoped attributes via GET", async () => {
          // Create product with inline custom attributes
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "List Scoped Attrs Product",
              product_attributes: [
                {
                  name: "Weight",
                  type: "unit",
                  values: ["500g"],
                },
                {
                  name: "Material",
                  type: "single_select",
                  values: ["Cotton"],
                },
              ],
            },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attributes).toHaveLength(2)
          expect(response.data.count).toEqual(2)
          const names = response.data.product_attributes.map(
            (a: any) => a.name
          )
          expect(names).toContain("Weight")
          expect(names).toContain("Material")
        })

        it("should return empty list for product with no scoped attributes", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            { title: "No Attrs Product" },
            adminHeaders
          )
          const productId = prodRes.data.product.id

          const response = await api.get(
            `/admin/products/${productId}/attributes`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attributes).toHaveLength(0)
          expect(response.data.count).toEqual(0)
        })
      })

      describe("POST /admin/products/:id/attributes/:attribute_id (update)", () => {
        it("should update a single_select attribute name and filterable flag", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Update Single Select Product",
              product_attributes: [
                {
                  name: "Color",
                  type: "single_select",
                  values: ["Red", "Blue"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const attrId = product.custom_attributes[0].id

          const response = await api.post(
            `/admin/products/${product.id}/attributes/${attrId}`,
            {
              name: "Colour",
              is_filterable: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute.name).toEqual("Colour")
          expect(response.data.product_attribute.is_filterable).toEqual(
            true
          )
          expect(response.data.product_attribute.type).toEqual(
            "single_select"
          )
          // Values should be preserved
          expect(
            response.data.product_attribute.values
          ).toHaveLength(2)
        })

        it("should update a multi_select attribute to mark as variant axis", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Update Multi Select Product",
              product_attributes: [
                {
                  name: "Size",
                  type: "multi_select",
                  values: ["S", "M", "L"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const attrId = product.custom_attributes[0].id

          const response = await api.post(
            `/admin/products/${product.id}/attributes/${attrId}`,
            {
              is_variant_axis: true,
              is_filterable: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.product_attribute.is_variant_axis
          ).toEqual(true)
          expect(
            response.data.product_attribute.is_filterable
          ).toEqual(true)
          expect(
            response.data.product_attribute.values
          ).toHaveLength(3)
        })

        it("should update a text attribute name and description", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Update Text Attr Product",
              product_attributes: [
                {
                  name: "Description",
                  type: "text",
                  values: ["Original text"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const attrId = product.custom_attributes[0].id

          const response = await api.post(
            `/admin/products/${product.id}/attributes/${attrId}`,
            {
              name: "Details",
              description: "Product details field",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute.name).toEqual("Details")
          expect(response.data.product_attribute.description).toEqual(
            "Product details field"
          )
          expect(response.data.product_attribute.type).toEqual("text")
        })

        it("should update a unit attribute to required", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Update Unit Attr Product",
              product_attributes: [
                {
                  name: "Weight",
                  type: "unit",
                  values: ["500g"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const attrId = product.custom_attributes[0].id

          const response = await api.post(
            `/admin/products/${product.id}/attributes/${attrId}`,
            {
              is_required: true,
              description: "Product weight in grams",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute.is_required).toEqual(
            true
          )
          expect(response.data.product_attribute.description).toEqual(
            "Product weight in grams"
          )
          expect(response.data.product_attribute.type).toEqual("unit")
          expect(response.data.product_attribute.name).toEqual("Weight")
        })

        it("should deactivate an attribute", async () => {
          const prodRes = await api.post(
            `/admin/products`,
            {
              title: "Deactivate Attr Product",
              product_attributes: [
                {
                  name: "Season",
                  type: "single_select",
                  values: ["Summer"],
                },
              ],
            },
            adminHeaders
          )
          const product = prodRes.data.product
          const attrId = product.custom_attributes[0].id

          const response = await api.post(
            `/admin/products/${product.id}/attributes/${attrId}`,
            { is_active: false },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute.is_active).toEqual(
            false
          )
        })

        it("should return 404 when attribute does not belong to product", async () => {
          // Create two products with different attributes
          const prod1Res = await api.post(
            `/admin/products`,
            {
              title: "Product A",
              product_attributes: [
                { name: "Field A", type: "text", values: ["a"] },
              ],
            },
            adminHeaders
          )
          const prod2Res = await api.post(
            `/admin/products`,
            { title: "Product B" },
            adminHeaders
          )

          const attrId =
            prod1Res.data.product.custom_attributes[0].id

          // Try to update Product A's attribute via Product B's URL
          const response = await api
            .post(
              `/admin/products/${prod2Res.data.product.id}/attributes/${attrId}`,
              { name: "Hacked" },
              adminHeaders
            )
            .catch((e: any) => e.response)

          // The workflow uses selector { id, product_id } so it should
          // not find the attribute and either 404 or update nothing
          expect([200, 404]).toContain(response.status)

          // Verify the attribute was NOT modified
          const attrCheck = await api.get(
            `/admin/product-attributes/${attrId}`,
            adminHeaders
          )
          expect(attrCheck.data.product_attribute.name).toEqual(
            "Field A"
          )
        })
      })

      describe("GET /admin/products", () => {
        it("should list products", async () => {
          await api.post(
            `/admin/products`,
            { title: "List Test Product" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.products).toBeDefined()
          expect(response.data.products.length).toBeGreaterThanOrEqual(
            1
          )
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should filter products by status", async () => {
          await api.post(
            `/admin/products`,
            { title: "Proposed Product" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products?status[]=proposed`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.products.every(
              (p: any) => p.status === "proposed"
            )
          ).toBe(true)
        })

        it("should search products with q parameter", async () => {
          await api.post(
            `/admin/products`,
            { title: "UniqueSearchableAdmin" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products?q=UniqueSearchableAdmin`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.products.length).toBeGreaterThanOrEqual(
            1
          )
          expect(
            response.data.products.some(
              (p: any) => p.title === "UniqueSearchableAdmin"
            )
          ).toBe(true)
        })
      })

      describe("GET /admin/products/:id", () => {
        it("should retrieve a product by id", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Retrieve Me" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.id).toEqual(productId)
          expect(response.data.product.title).toEqual("Retrieve Me")
        })

        it("should return 404 for non-existent product", async () => {
          const response = await api
            .get(
              `/admin/products/prod_nonexistent`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/products/:id", () => {
        it("should update a product", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Before Update" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              title: "After Update",
              description: "Updated description",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.title).toEqual("After Update")
          expect(response.data.product.description).toEqual(
            "Updated description"
          )
        })
      })

      describe("DELETE /admin/products/:id", () => {
        it("should delete a product", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Delete Me" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.delete(
            `/admin/products/${productId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual(productId)
          expect(response.data.object).toEqual("product")
          expect(response.data.deleted).toEqual(true)
        })
      })

      describe("Product Lifecycle (publish, reject, request-changes)", () => {
        let productId: string
        let rejectionReasonId: string

        beforeEach(async () => {
          const { seller } = await createSellerUser(appContainer)

          const { result } = await submitSellerProductsWorkflow(
            appContainer
          ).run({
            input: {
              products: [{ title: "Lifecycle Product" }],
              seller_id: seller.id,
            },
          })
          productId = result[0].id

          const reasonRes = await api.post(
            `/admin/product-rejection-reasons`,
            {
              code: `reason-${Date.now()}`,
              label: "Incomplete info",
              type: "temporary",
            },
            adminHeaders
          )
          rejectionReasonId =
            reasonRes.data.product_rejection_reason.id
        })

        it("should publish a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/publish`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual("published")
        })

        it("should reject a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/reject`,
            {
              rejection_reason_ids: [rejectionReasonId],
              message: "Not acceptable",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual("rejected")
        })

        it("should request changes on a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/request-changes`,
            {
              rejection_reason_ids: [rejectionReasonId],
              message: "Please fix the images",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual(
            "changes_required"
          )
        })

      })

      describe("Product Variants", () => {
        let productId: string

        beforeEach(async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Variant Parent Product" },
            adminHeaders
          )
          productId = createRes.data.product.id
        })

        describe("POST /admin/products/:id/variants", () => {
          it("should create a variant for a product", async () => {
            const response = await api.post(
              `/admin/products/${productId}/variants`,
              {
                title: "New Variant",
                sku: `ADMIN-VAR-${Date.now()}`,
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.product).toBeDefined()
            expect(
              response.data.product.variants.some(
                (v: any) => v.title === "New Variant"
              )
            ).toBe(true)
          })
        })

        describe("GET /admin/products/:id/variants", () => {
          it("should list variants for a product", async () => {
            await api.post(
              `/admin/products/${productId}/variants`,
              { title: "Listed Variant", sku: `ADMIN-LIST-${Date.now()}` },
              adminHeaders
            )

            const response = await api.get(
              `/admin/products/${productId}/variants`,
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.variants).toBeDefined()
            expect(
              response.data.variants.length
            ).toBeGreaterThanOrEqual(1)
          })
        })

        describe("DELETE /admin/products/:id/variants/:variant_id", () => {
          it("should delete a variant", async () => {
            const createVarRes = await api.post(
              `/admin/products/${productId}/variants`,
              { title: "To Delete", sku: `ADMIN-DEL-${Date.now()}` },
              adminHeaders
            )
            const variantId =
              createVarRes.data.product.variants.find(
                (v: any) => v.title === "To Delete"
              )?.id

            const response = await api.delete(
              `/admin/products/${productId}/variants/${variantId}`,
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.id).toEqual(variantId)
            expect(response.data.object).toEqual("variant")
            expect(response.data.deleted).toEqual(true)
          })
        })
      })
    })

    // describe("Admin - Product Brands", () => {
    //   let appContainer: MedusaContainer

    //   beforeAll(async () => {
    //     appContainer = getContainer()
    //   })

    //   beforeEach(async () => {
    //     await createAdminUser(
    //       dbConnection,
    //       adminHeaders,
    //       appContainer
    //     )
    //   })

    //   describe("POST /admin/product-brands", () => {
    //     it("should create a product brand", async () => {
    //       const response = await api.post(
    //         `/admin/product-brands`,
    //         {
    //           name: "Nike",
    //           is_restricted: false,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_brand).toBeDefined()
    //       expect(response.data.product_brand.name).toEqual("Nike")
    //       expect(response.data.product_brand.is_restricted).toEqual(
    //         false
    //       )
    //       expect(response.data.product_brand.handle).toBeDefined()
    //     })

    //     it("should create a restricted brand", async () => {
    //       const response = await api.post(
    //         `/admin/product-brands`,
    //         {
    //           name: "Restricted Brand",
    //           is_restricted: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_brand.is_restricted).toEqual(
    //         true
    //       )
    //     })
    //   })

    //   describe("GET /admin/product-brands", () => {
    //     it("should list product brands", async () => {
    //       await api.post(
    //         `/admin/product-brands`,
    //         { name: `Brand-List-${Date.now()}` },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-brands`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_brands).toBeDefined()
    //       expect(
    //         response.data.product_brands.length
    //       ).toBeGreaterThanOrEqual(1)
    //       expect(response.data.count).toBeDefined()
    //     })

    //     it("should search brands with q parameter", async () => {
    //       await api.post(
    //         `/admin/product-brands`,
    //         { name: "UniqueSearchBrand" },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-brands?q=UniqueSearchBrand`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_brands.some(
    //           (b: any) => b.name === "UniqueSearchBrand"
    //         )
    //       ).toBe(true)
    //     })

    //     it("should filter brands by is_restricted", async () => {
    //       await api.post(
    //         `/admin/product-brands`,
    //         { name: `Restricted-${Date.now()}`, is_restricted: true },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-brands?is_restricted=true`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_brands.every(
    //           (b: any) => b.is_restricted === true
    //         )
    //       ).toBe(true)
    //     })
    //   })

    //   describe("GET /admin/product-brands/:id", () => {
    //     it("should retrieve a brand by id", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-brands`,
    //         { name: `Retrieve-Brand-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const brandId = createRes.data.product_brand.id

    //       const response = await api.get(
    //         `/admin/product-brands/${brandId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_brand.id).toEqual(brandId)
    //     })

    //     it("should return 404 for non-existent brand", async () => {
    //       const response = await api
    //         .get(
    //           `/admin/product-brands/pbrand_nonexistent`,
    //           adminHeaders
    //         )
    //         .catch((e: any) => e.response)

    //       expect(response.status).toEqual(404)
    //     })
    //   })

    //   describe("POST /admin/product-brands/:id", () => {
    //     it("should update a brand", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-brands`,
    //         { name: `Update-Brand-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const brandId = createRes.data.product_brand.id

    //       const response = await api.post(
    //         `/admin/product-brands/${brandId}`,
    //         {
    //           name: "Updated Brand Name",
    //           is_restricted: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_brand.name).toEqual(
    //         "Updated Brand Name"
    //       )
    //       expect(response.data.product_brand.is_restricted).toEqual(
    //         true
    //       )
    //     })
    //   })

    //   describe("DELETE /admin/product-brands/:id", () => {
    //     it("should delete a brand", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-brands`,
    //         { name: `Delete-Brand-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const brandId = createRes.data.product_brand.id

    //       const response = await api.delete(
    //         `/admin/product-brands/${brandId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(brandId)
    //       expect(response.data.object).toEqual("product_brand")
    //       expect(response.data.deleted).toEqual(true)
    //     })
    //   })
    // })

    // describe("Admin - Product Categories", () => {
    //   let appContainer: MedusaContainer

    //   beforeAll(async () => {
    //     appContainer = getContainer()
    //   })

    //   beforeEach(async () => {
    //     await createAdminUser(
    //       dbConnection,
    //       adminHeaders,
    //       appContainer
    //     )
    //   })

    //   describe("POST /admin/product-categories", () => {
    //     it("should create a product category", async () => {
    //       const response = await api.post(
    //         `/admin/product-categories`,
    //         {
    //           name: "Electronics",
    //           is_active: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_category).toBeDefined()
    //       expect(response.data.product_category.name).toEqual(
    //         "Electronics"
    //       )
    //       expect(response.data.product_category.is_active).toEqual(
    //         true
    //       )
    //       expect(
    //         response.data.product_category.handle
    //       ).toBeDefined()
    //     })

    //     it("should create a child category", async () => {
    //       const parentRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: "Parent Category" },
    //         adminHeaders
    //       )
    //       const parentId = parentRes.data.product_category.id

    //       const response = await api.post(
    //         `/admin/product-categories`,
    //         {
    //           name: "Child Category",
    //           parent_category_id: parentId,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_category.parent_category_id
    //       ).toEqual(parentId)
    //     })

    //     it("should create a restricted category", async () => {
    //       const response = await api.post(
    //         `/admin/product-categories`,
    //         {
    //           name: "Restricted Category",
    //           is_restricted: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_category.is_restricted
    //       ).toEqual(true)
    //     })

    //     it("should create a category with attributes", async () => {
    //       const attrRes = await api.post(
    //         `/admin/product-attributes`,
    //         {
    //           name: "Color",
    //           type: "single_select",
    //         },
    //         adminHeaders
    //       )
    //       const attributeId = attrRes.data.product_attribute.id

    //       const response = await api.post(
    //         `/admin/product-categories`,
    //         {
    //           name: "Category with Attrs",
    //           attribute_ids: [attributeId],
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_category
    //       ).toBeDefined()
    //     })
    //   })

    //   describe("GET /admin/product-categories", () => {
    //     it("should list product categories", async () => {
    //       await api.post(
    //         `/admin/product-categories`,
    //         { name: `Cat-List-${Date.now()}` },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-categories`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_categories).toBeDefined()
    //       expect(
    //         response.data.product_categories.length
    //       ).toBeGreaterThanOrEqual(1)
    //       expect(response.data.count).toBeDefined()
    //     })

    //     it("should filter by parent_category_id", async () => {
    //       const parentRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Parent-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const parentId = parentRes.data.product_category.id

    //       await api.post(
    //         `/admin/product-categories`,
    //         {
    //           name: `Child-${Date.now()}`,
    //           parent_category_id: parentId,
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-categories?parent_category_id=${parentId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_categories).toHaveLength(1)
    //     })

    //     it("should search categories with q parameter", async () => {
    //       await api.post(
    //         `/admin/product-categories`,
    //         { name: "UniqueAdminSearchCat" },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-categories?q=UniqueAdminSearchCat`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_categories.length
    //       ).toBeGreaterThanOrEqual(1)
    //     })
    //   })

    //   describe("GET /admin/product-categories/:id", () => {
    //     it("should retrieve a category by id", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Retrieve-Cat-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const categoryId = createRes.data.product_category.id

    //       const response = await api.get(
    //         `/admin/product-categories/${categoryId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_category.id).toEqual(
    //         categoryId
    //       )
    //     })

    //     it("should return 404 for non-existent category", async () => {
    //       const response = await api
    //         .get(
    //           `/admin/product-categories/pcat_nonexistent`,
    //           adminHeaders
    //         )
    //         .catch((e: any) => e.response)

    //       expect(response.status).toEqual(404)
    //     })
    //   })

    //   describe("POST /admin/product-categories/:id", () => {
    //     it("should update a category", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Update-Cat-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const categoryId = createRes.data.product_category.id

    //       const response = await api.post(
    //         `/admin/product-categories/${categoryId}`,
    //         {
    //           name: "Updated Category",
    //           is_active: true,
    //           is_restricted: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_category.name).toEqual(
    //         "Updated Category"
    //       )
    //       expect(
    //         response.data.product_category.is_active
    //       ).toEqual(true)
    //       expect(
    //         response.data.product_category.is_restricted
    //       ).toEqual(true)
    //     })
    //   })

    //   describe("DELETE /admin/product-categories/:id", () => {
    //     it("should delete a category", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Delete-Cat-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const categoryId = createRes.data.product_category.id

    //       const response = await api.delete(
    //         `/admin/product-categories/${categoryId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(categoryId)
    //       expect(response.data.object).toEqual("product_category")
    //       expect(response.data.deleted).toEqual(true)
    //     })
    //   })

    //   describe("POST /admin/product-categories/:id/products", () => {
    //     it("should add products to a category", async () => {
    //       const catRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Cat-Products-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const categoryId = catRes.data.product_category.id

    //       const prodRes = await api.post(
    //         `/admin/products`,
    //         { title: "Product for Category" },
    //         adminHeaders
    //       )
    //       const productId = prodRes.data.product.id

    //       const response = await api.post(
    //         `/admin/product-categories/${categoryId}/products`,
    //         { add: [productId] },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(categoryId)
    //       expect(response.data.object).toEqual("product_category")
    //     })

    //     it("should remove products from a category", async () => {
    //       const catRes = await api.post(
    //         `/admin/product-categories`,
    //         { name: `Cat-Remove-${Date.now()}` },
    //         adminHeaders
    //       )
    //       const categoryId = catRes.data.product_category.id

    //       const prodRes = await api.post(
    //         `/admin/products`,
    //         { title: "Product to Remove" },
    //         adminHeaders
    //       )
    //       const productId = prodRes.data.product.id

    //       await api.post(
    //         `/admin/product-categories/${categoryId}/products`,
    //         { add: [productId] },
    //         adminHeaders
    //       )

    //       const response = await api.post(
    //         `/admin/product-categories/${categoryId}/products`,
    //         { remove: [productId] },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(categoryId)
    //     })
    //   })
    // })

    // describe("Admin - Product Attributes", () => {
    //   let appContainer: MedusaContainer

    //   beforeAll(async () => {
    //     appContainer = getContainer()
    //   })

    //   beforeEach(async () => {
    //     await createAdminUser(
    //       dbConnection,
    //       adminHeaders,
    //       appContainer
    //     )
    //   })

    //   describe("POST /admin/product-attributes", () => {
    //     it("should create a product attribute", async () => {
    //       const response = await api.post(
    //         `/admin/product-attributes`,
    //         {
    //           name: "Color",
    //           type: "single_select",
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_attribute).toBeDefined()
    //       expect(response.data.product_attribute.name).toEqual(
    //         "Color"
    //       )
    //       expect(response.data.product_attribute.type).toEqual(
    //         "single_select"
    //       )
    //       expect(
    //         response.data.product_attribute.handle
    //       ).toBeDefined()
    //     })

    //     it("should create a variant axis attribute", async () => {
    //       const response = await api.post(
    //         `/admin/product-attributes`,
    //         {
    //           name: "Size",
    //           type: "multi_select",
    //           is_variant_axis: true,
    //           is_filterable: true,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_attribute.is_variant_axis
    //       ).toEqual(true)
    //       expect(
    //         response.data.product_attribute.is_filterable
    //       ).toEqual(true)
    //     })

    //     it("should create attributes of different types", async () => {
    //       const types = [
    //         "single_select",
    //         "multi_select",
    //         "text",
    //         "toggle",
    //         "unit",
    //       ]

    //       for (const type of types) {
    //         const response = await api.post(
    //           `/admin/product-attributes`,
    //           {
    //             name: `Attr-${type}-${Date.now()}`,
    //             type,
    //           },
    //           adminHeaders
    //         )

    //         expect(response.status).toEqual(200)
    //         expect(response.data.product_attribute.type).toEqual(
    //           type
    //         )
    //       }
    //     })
    //   })

    //   describe("GET /admin/product-attributes", () => {
    //     it("should list global product attributes", async () => {
    //       await api.post(
    //         `/admin/product-attributes`,
    //         { name: `Global-Attr-${Date.now()}`, type: "text" },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-attributes`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_attributes).toBeDefined()
    //       expect(
    //         response.data.product_attributes.length
    //       ).toBeGreaterThanOrEqual(1)
    //       expect(response.data.count).toBeDefined()
    //     })

    //     it("should filter by type", async () => {
    //       await api.post(
    //         `/admin/product-attributes`,
    //         { name: `Toggle-Attr-${Date.now()}`, type: "toggle" },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-attributes?type[]=toggle`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_attributes.every(
    //           (a: any) => a.type === "toggle"
    //         )
    //       ).toBe(true)
    //     })

    //     it("should filter by is_variant_axis", async () => {
    //       await api.post(
    //         `/admin/product-attributes`,
    //         {
    //           name: `Axis-Attr-${Date.now()}`,
    //           type: "multi_select",
    //           is_variant_axis: true,
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-attributes?is_variant_axis=true`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_attributes.every(
    //           (a: any) => a.is_variant_axis === true
    //         )
    //       ).toBe(true)
    //     })
    //   })

    //   describe("GET /admin/product-attributes/:id", () => {
    //     it("should retrieve an attribute by id", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-attributes`,
    //         { name: `Retrieve-Attr-${Date.now()}`, type: "text" },
    //         adminHeaders
    //       )
    //       const attributeId = createRes.data.product_attribute.id

    //       const response = await api.get(
    //         `/admin/product-attributes/${attributeId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_attribute.id).toEqual(
    //         attributeId
    //       )
    //     })

    //     it("should return 404 for non-existent attribute", async () => {
    //       const response = await api
    //         .get(
    //           `/admin/product-attributes/pattr_nonexistent`,
    //           adminHeaders
    //         )
    //         .catch((e: any) => e.response)

    //       expect(response.status).toEqual(404)
    //     })
    //   })

    //   describe("POST /admin/product-attributes/:id", () => {
    //     it("should update an attribute", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-attributes`,
    //         { name: `Update-Attr-${Date.now()}`, type: "text" },
    //         adminHeaders
    //       )
    //       const attributeId = createRes.data.product_attribute.id

    //       const response = await api.post(
    //         `/admin/product-attributes/${attributeId}`,
    //         {
    //           name: "Updated Attribute",
    //           is_filterable: true,
    //           is_active: false,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.product_attribute.name).toEqual(
    //         "Updated Attribute"
    //       )
    //       expect(
    //         response.data.product_attribute.is_filterable
    //       ).toEqual(true)
    //       expect(
    //         response.data.product_attribute.is_active
    //       ).toEqual(false)
    //     })
    //   })

    //   describe("DELETE /admin/product-attributes/:id", () => {
    //     it("should delete an attribute", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-attributes`,
    //         { name: `Delete-Attr-${Date.now()}`, type: "text" },
    //         adminHeaders
    //       )
    //       const attributeId = createRes.data.product_attribute.id

    //       const response = await api.delete(
    //         `/admin/product-attributes/${attributeId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(attributeId)
    //       expect(response.data.object).toEqual("product_attribute")
    //       expect(response.data.deleted).toEqual(true)
    //     })
    //   })

    //   describe("Attribute Values", () => {
    //     let attributeId: string

    //     beforeEach(async () => {
    //       const createRes = await api.post(
    //         `/admin/product-attributes`,
    //         {
    //           name: `Select-Attr-${Date.now()}`,
    //           type: "single_select",
    //         },
    //         adminHeaders
    //       )
    //       attributeId = createRes.data.product_attribute.id
    //     })

    //     describe("POST /admin/product-attributes/:id/values", () => {
    //       it("should create a value for an attribute", async () => {
    //         const response = await api.post(
    //           `/admin/product-attributes/${attributeId}/values`,
    //           { values: [{ name: "Red" }] },
    //           adminHeaders
    //         )

    //         expect(response.status).toEqual(200)
    //         expect(
    //           response.data.product_attribute
    //         ).toBeDefined()
    //         expect(
    //           response.data.product_attribute.values.some(
    //             (v: any) => v.name === "Red"
    //           )
    //         ).toBe(true)
    //       })

    //       it("should create multiple values", async () => {
    //         await api.post(
    //           `/admin/product-attributes/${attributeId}/values`,
    //           { values: [{ name: "Blue" }] },
    //           adminHeaders
    //         )
    //         await api.post(
    //           `/admin/product-attributes/${attributeId}/values`,
    //           { values: [{ name: "Green" }] },
    //           adminHeaders
    //         )

    //         const response = await api.get(
    //           `/admin/product-attributes/${attributeId}`,
    //           adminHeaders
    //         )

    //         expect(response.status).toEqual(200)
    //         const valueNames =
    //           response.data.product_attribute.values.map(
    //             (v: any) => v.name
    //           )
    //         expect(valueNames).toContain("Blue")
    //         expect(valueNames).toContain("Green")
    //       })
    //     })

    //     describe("POST /admin/product-attributes/:id/values/:value_id", () => {
    //       it("should update a value", async () => {
    //         const createValRes = await api.post(
    //           `/admin/product-attributes/${attributeId}/values`,
    //           { values: [{ name: "Original Value" }] },
    //           adminHeaders
    //         )
    //         const valueId =
    //           createValRes.data.product_attribute.values.find(
    //             (v: any) => v.name === "Original Value"
    //           )?.id

    //         const response = await api.post(
    //           `/admin/product-attributes/${attributeId}/values/${valueId}`,
    //           { name: "Updated Value" },
    //           adminHeaders
    //         )

    //         expect(response.status).toEqual(200)
    //         expect(
    //           response.data.product_attribute.values.some(
    //             (v: any) => v.name === "Updated Value"
    //           )
    //         ).toBe(true)
    //       })
    //     })

    //     describe("DELETE /admin/product-attributes/:id/values/:value_id", () => {
    //       it("should delete a value", async () => {
    //         const createValRes = await api.post(
    //           `/admin/product-attributes/${attributeId}/values`,
    //           { values: [{ name: "Delete Me Value" }] },
    //           adminHeaders
    //         )
    //         const valueId =
    //           createValRes.data.product_attribute.values.find(
    //             (v: any) => v.name === "Delete Me Value"
    //           )?.id

    //         const response = await api.delete(
    //           `/admin/product-attributes/${attributeId}/values/${valueId}`,
    //           adminHeaders
    //         )

    //         expect(response.status).toEqual(200)
    //         expect(
    //           response.data.product_attribute.values.some(
    //             (v: any) => v.id === valueId
    //           )
    //         ).toBe(false)
    //       })
    //     })
    //   })
    // })

    // describe("Admin - Product Rejection Reasons", () => {
    //   let appContainer: MedusaContainer

    //   beforeAll(async () => {
    //     appContainer = getContainer()
    //   })

    //   beforeEach(async () => {
    //     await createAdminUser(
    //       dbConnection,
    //       adminHeaders,
    //       appContainer
    //     )
    //   })

    //   describe("POST /admin/product-rejection-reasons", () => {
    //     it("should create a temporary rejection reason", async () => {
    //       const response = await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `incomplete-info-${Date.now()}`,
    //           label: "Incomplete Information",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reason
    //       ).toBeDefined()
    //       expect(
    //         response.data.product_rejection_reason.label
    //       ).toEqual("Incomplete Information")
    //       expect(
    //         response.data.product_rejection_reason.type
    //       ).toEqual("temporary")
    //       expect(
    //         response.data.product_rejection_reason.is_active
    //       ).toEqual(true)
    //     })

    //     it("should create a permanent rejection reason", async () => {
    //       const response = await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `prohibited-item-${Date.now()}`,
    //           label: "Prohibited Item",
    //           type: "permanent",
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reason.type
    //       ).toEqual("permanent")
    //     })
    //   })

    //   describe("GET /admin/product-rejection-reasons", () => {
    //     it("should list rejection reasons", async () => {
    //       await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `list-reason-${Date.now()}`,
    //           label: "List Reason",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-rejection-reasons`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reasons
    //       ).toBeDefined()
    //       expect(
    //         response.data.product_rejection_reasons.length
    //       ).toBeGreaterThanOrEqual(1)
    //       expect(response.data.count).toBeDefined()
    //     })

    //     it("should filter by type", async () => {
    //       await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `perm-reason-${Date.now()}`,
    //           label: "Permanent Reason",
    //           type: "permanent",
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-rejection-reasons?type[]=permanent`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reasons.every(
    //           (r: any) => r.type === "permanent"
    //         )
    //       ).toBe(true)
    //     })

    //     it("should search with q parameter", async () => {
    //       await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `unique-searchable-${Date.now()}`,
    //           label: "UniqueSearchableReason",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-rejection-reasons?q=UniqueSearchableReason`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reasons.length
    //       ).toBeGreaterThanOrEqual(1)
    //     })

    //     it("should filter by is_active", async () => {
    //       await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `active-reason-${Date.now()}`,
    //           label: "Active Reason",
    //           type: "temporary",
    //           is_active: true,
    //         },
    //         adminHeaders
    //       )

    //       const response = await api.get(
    //         `/admin/product-rejection-reasons?is_active=true`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reasons.every(
    //           (r: any) => r.is_active === true
    //         )
    //       ).toBe(true)
    //     })
    //   })

    //   describe("GET /admin/product-rejection-reasons/:id", () => {
    //     it("should retrieve a rejection reason by id", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `retrieve-reason-${Date.now()}`,
    //           label: "Retrieve Reason",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )
    //       const reasonId =
    //         createRes.data.product_rejection_reason.id

    //       const response = await api.get(
    //         `/admin/product-rejection-reasons/${reasonId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reason.id
    //       ).toEqual(reasonId)
    //       expect(
    //         response.data.product_rejection_reason.label
    //       ).toEqual("Retrieve Reason")
    //     })

    //     it("should return 404 for non-existent reason", async () => {
    //       const response = await api
    //         .get(
    //           `/admin/product-rejection-reasons/prejreason_nonexistent`,
    //           adminHeaders
    //         )
    //         .catch((e: any) => e.response)

    //       expect(response.status).toEqual(404)
    //     })
    //   })

    //   describe("POST /admin/product-rejection-reasons/:id", () => {
    //     it("should update a rejection reason", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `update-reason-${Date.now()}`,
    //           label: "Original Label",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )
    //       const reasonId =
    //         createRes.data.product_rejection_reason.id

    //       const response = await api.post(
    //         `/admin/product-rejection-reasons/${reasonId}`,
    //         {
    //           label: "Updated Label",
    //           type: "permanent",
    //           is_active: false,
    //         },
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(
    //         response.data.product_rejection_reason.label
    //       ).toEqual("Updated Label")
    //       expect(
    //         response.data.product_rejection_reason.type
    //       ).toEqual("permanent")
    //       expect(
    //         response.data.product_rejection_reason.is_active
    //       ).toEqual(false)
    //     })
    //   })

    //   describe("DELETE /admin/product-rejection-reasons/:id", () => {
    //     it("should delete a rejection reason", async () => {
    //       const createRes = await api.post(
    //         `/admin/product-rejection-reasons`,
    //         {
    //           code: `delete-reason-${Date.now()}`,
    //           label: "Delete Reason",
    //           type: "temporary",
    //         },
    //         adminHeaders
    //       )
    //       const reasonId =
    //         createRes.data.product_rejection_reason.id

    //       const response = await api.delete(
    //         `/admin/product-rejection-reasons/${reasonId}`,
    //         adminHeaders
    //       )

    //       expect(response.status).toEqual(200)
    //       expect(response.data.id).toEqual(reasonId)
    //       expect(response.data.object).toEqual(
    //         "product_rejection_reason"
    //       )
    //       expect(response.data.deleted).toEqual(true)
    //     })
    //   })
    // })
  },
})
