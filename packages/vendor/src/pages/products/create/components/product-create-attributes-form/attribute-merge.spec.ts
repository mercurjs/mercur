import { describe, expect, test } from "vitest"

import {
  AttributeEntry,
  mergeRequiredAttributes,
  mergeSelectedAttributes,
  RequiredAttributeInput,
} from "./attribute-merge"

const custom = (
  title: string,
  values: string | string[],
  useForVariants: boolean
): AttributeEntry => ({
  attribute_id: undefined,
  title,
  values,
  is_custom: true,
  use_for_variants: useForVariants,
})

const required = (id: string, name: string): RequiredAttributeInput => ({
  id,
  name,
  type: "text",
})

describe("mergeRequiredAttributes (MER-183)", () => {
  test("preserves the order and identity of existing custom attributes", () => {
    // Repro: user created two custom attributes, "Color" (variant axis, with
    // values) and "Internal Code" (informational). Required attributes then
    // load for the chosen category.
    const color = custom("Color", ["Red", "Blue"], true)
    const internalCode = custom("Internal Code", "ABC-123", false)
    const current = [color, internalCode]

    const next = mergeRequiredAttributes(current, [required("attr_1", "Brand")])

    // Customs keep their position (index-aligned with the field-array
    // snapshot) — they are NOT moved behind the required attributes.
    expect(next[0]).toBe(color)
    expect(next[1]).toBe(internalCode)
    // The new required attribute is appended at the end.
    expect(next[2]).toMatchObject({
      attribute_id: "attr_1",
      title: "Brand",
      is_required: true,
      is_custom: false,
    })
    // Crucially, no values were wiped and no toggle flipped.
    expect(next[0].values).toEqual(["Red", "Blue"])
    expect(next[0].use_for_variants).toBe(true)
    expect(next[1].values).toBe("ABC-123")
    expect(next[1].use_for_variants).toBe(false)
  })

  test("returns the same array reference when nothing changed (refetch no-op)", () => {
    // A window-focus refetch returns the same required attributes — the merge
    // must be a no-op so the caller can skip setValue and avoid remounting /
    // corrupting the rows.
    const current = [
      custom("Color", ["Red"], true),
      {
        attribute_id: "attr_1",
        title: "Brand",
        values: "Acme",
        is_custom: false,
        is_required: true,
        use_for_variants: false,
        type: "text",
      } satisfies AttributeEntry,
    ]

    const next = mergeRequiredAttributes(current, [required("attr_1", "Brand")])

    expect(next).toBe(current)
  })

  test("preserves values of an already-present required attribute", () => {
    const current: AttributeEntry[] = [
      {
        attribute_id: "attr_1",
        title: "Brand",
        values: "Acme",
        is_custom: false,
        is_required: true,
        use_for_variants: false,
        type: "text",
      },
    ]

    const next = mergeRequiredAttributes(current, [required("attr_1", "Brand")])

    expect(next).toBe(current)
    expect(next[0].values).toBe("Acme")
  })

  test("marks an existing entry as required without reordering", () => {
    const color = custom("Color", ["Red"], true)
    const brand: AttributeEntry = {
      attribute_id: "attr_1",
      title: "Brand",
      values: "Acme",
      is_custom: false,
      is_required: false,
      use_for_variants: false,
      type: "text",
    }
    const current = [color, brand]

    const next = mergeRequiredAttributes(current, [required("attr_1", "Brand")])

    expect(next[0]).toBe(color)
    expect(next[1]).toMatchObject({ attribute_id: "attr_1", is_required: true })
    expect(next[1].values).toBe("Acme")
  })
})

describe("mergeSelectedAttributes (MER-183)", () => {
  const selected = (id: string, name: string): AttributeEntry => ({
    attribute_id: id,
    title: name,
    values: [],
    is_custom: false,
    is_required: false,
    use_for_variants: false,
    type: "text",
  })

  test("keeps custom attributes in their original position", () => {
    const color = custom("Color", ["Red"], true)
    const current = [color]

    const next = mergeSelectedAttributes(current, [selected("attr_1", "Brand")])

    // Custom stays first; selected appended after — not the other way around.
    expect(next[0]).toBe(color)
    expect(next[1]).toMatchObject({ attribute_id: "attr_1", title: "Brand" })
  })

  test("updates a still-selected entry in place and drops deselected ones", () => {
    const color = custom("Color", ["Red"], true)
    const current: AttributeEntry[] = [
      selected("attr_1", "Brand"),
      color,
      selected("attr_2", "Size"),
    ]

    // "Size" was deselected; "Brand" stays selected with new values.
    const updatedBrand: AttributeEntry = {
      ...selected("attr_1", "Brand"),
      values: ["Acme"],
    }
    const next = mergeSelectedAttributes(current, [updatedBrand])

    expect(next).toHaveLength(2)
    expect(next[0]).toBe(updatedBrand)
    expect(next[0].values).toEqual(["Acme"])
    expect(next[1]).toBe(color)
  })
})
