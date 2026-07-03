import { ProductChangeActionDTO, ProductChangeActionType } from "@mercurjs/types"
import { describe, expect, test } from "vitest"

import { buildProductChangeView } from "./product-change-diff"

const act = (
  action: ProductChangeActionType,
  details: Record<string, unknown>,
  id = "act_1"
): ProductChangeActionDTO =>
  ({
    id,
    product_id: "prod_1",
    product_change_id: "chg_1",
    ordering: 0,
    action,
    details,
    internal_note: null,
    applied: false,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    deleted_at: null,
  }) as ProductChangeActionDTO

describe("buildProductChangeView", () => {
  test("classifies a product field update", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.UPDATE, {
        field: "title",
        previous_value: "Old",
        value: "New",
      }),
    ])
    expect(view.productUpdated).toEqual([
      { field: "title", previous: "Old", next: "New" },
    ])
    expect(view.productMedia).toEqual({ added: [], removed: [] })
  })

  test("splits product images into added / removed", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.UPDATE, {
        field: "images",
        previous_value: [{ url: "a" }, { url: "b" }],
        value: [{ url: "b" }, { url: "c" }],
      }),
    ])
    expect(view.productUpdated).toHaveLength(0)
    expect(view.productMedia.added).toEqual([{ url: "c" }])
    expect(view.productMedia.removed).toEqual([{ url: "a" }])
  })

  test("handles ATTRIBUTE_UPDATE as an updated attribute change", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.ATTRIBUTE_UPDATE, {
        update: { id: "attr_1", add: ["val_red"], remove: ["val_blue"] },
      }),
    ])
    expect(view.attributes).toEqual([
      {
        kind: "updated",
        attributeId: "attr_1",
        inlineTitle: undefined,
        addValueIds: ["val_red"],
        addValueNames: [],
        removeValueIds: ["val_blue"],
        scalarValue: undefined,
      },
    ])
  })

  test("parses ATTRIBUTE_ADD by id and inline", () => {
    const view = buildProductChangeView([
      act(
        ProductChangeActionType.ATTRIBUTE_ADD,
        { attribute: { id: "attr_1", value_ids: ["v1"] } },
        "a1"
      ),
      act(
        ProductChangeActionType.ATTRIBUTE_ADD,
        { attribute: { title: "Material", value: "Cotton" } },
        "a2"
      ),
    ])
    expect(view.attributes[0]).toMatchObject({
      kind: "added",
      attributeId: "attr_1",
      addValueIds: ["v1"],
    })
    expect(view.attributes[1]).toMatchObject({
      kind: "added",
      inlineTitle: "Material",
      scalarValue: "Cotton",
    })
  })

  test("groups variant updates, splits variant media, skips manage_inventory", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.VARIANT_UPDATE, {
        variant_id: "var_1",
        previous_fields: { sku: "443" },
        fields: {
          sku: "444",
          manage_inventory: true,
          images: { add: [{ url: "new" }], remove: [{ url: "old" }] },
        },
      }),
    ])
    expect(view.variantGroups).toHaveLength(1)
    const group = view.variantGroups[0]
    expect(group.variantId).toBe("var_1")
    expect(group.fieldDiffs).toEqual([
      { field: "sku", previous: "443", next: "444", variant_id: "var_1" },
    ])
    expect(group.media.added).toEqual([{ url: "new" }])
    expect(group.media.removed).toEqual([{ url: "old" }])
  })

  test("captures variant add / remove and delete request", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.VARIANT_ADD, { variant: { title: "XS" } }, "v1"),
      act(ProductChangeActionType.VARIANT_REMOVE, { variant_id: "var_2" }, "v2"),
      act(ProductChangeActionType.PRODUCT_DELETE, {}, "d1"),
    ])
    expect(view.variantsAdded).toHaveLength(1)
    expect(view.variantsRemoved).toHaveLength(1)
    expect(view.deleteRequested).toBe(true)
  })

  test("ignores CHANGE_REQUESTED audit rows", () => {
    const view = buildProductChangeView([
      act(ProductChangeActionType.CHANGE_REQUESTED, { message: "fix it" }),
    ])
    expect(view.productUpdated).toHaveLength(0)
    expect(view.attributes).toHaveLength(0)
    expect(view.deleteRequested).toBe(false)
  })

  test("orders organization fields as category, collection, tags, type", () => {
    const update = (field: string) =>
      act(ProductChangeActionType.UPDATE, {
        field,
        previous_value: null,
        value: "x",
      })
    const view = buildProductChangeView([
      update("type_id"),
      update("tags"),
      update("collection_id"),
      update("categories"),
    ])
    expect(view.productUpdated.map((d) => d.field)).toEqual([
      "categories",
      "collection_id",
      "tags",
      "type_id",
    ])
  })

  test("keeps non-organization fields ahead of the organization block in order", () => {
    const update = (field: string) =>
      act(ProductChangeActionType.UPDATE, {
        field,
        previous_value: "old",
        value: "new",
      })
    const view = buildProductChangeView([
      update("type_id"),
      update("title"),
      update("categories"),
      update("subtitle"),
    ])
    expect(view.productUpdated.map((d) => d.field)).toEqual([
      "title",
      "subtitle",
      "categories",
      "type_id",
    ])
  })
})
