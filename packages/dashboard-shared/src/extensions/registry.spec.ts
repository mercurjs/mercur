import { describe, expect, test } from "vitest"

import { ExtensionRegistry } from "./registry"

type Order = { id: string; disputes?: { status: string }[] }

const openDispute = (entity: unknown) =>
  (entity as Order).disputes?.some((d) => d.status === "open")
    ? "Item under dispute"
    : undefined

describe("ExtensionRegistry", () => {
  test("keeps a tab widget's label and placement", () => {
    const Component = () => null
    const registry = new ExtensionRegistry({
      widgets: {
        widgets: [
          {
            Component,
            zone: ["stores.detail.tabs.after"],
            widgetId: "loyalty",
            label: "Loyalty",
          },
          { Component, zone: ["stores.detail.tabs.before"], widgetId: "kyc" },
        ],
      },
    })

    const tabs = registry.getWidgets("stores.detail.tabs")
    expect(tabs.after).toEqual([
      { Component, widgetId: "loyalty", label: "Loyalty", permission: undefined },
    ])
    expect(tabs.before.map((widget) => widget.label)).toEqual([undefined])
  })

  test("action locks return undefined without configs", () => {
    const registry = new ExtensionRegistry()
    expect(registry.getActionLock("order", "return", { id: "o" })).toBeUndefined()
    expect(registry.getActivity("order", { id: "o" })).toEqual([])
  })

  test("returns the first lock reason declared for the action", () => {
    const registry = new ExtensionRegistry({
      customFields: {
        configs: [
          { model: "order", actionLocks: { claim: () => "other" } },
          { model: "order", actionLocks: { return: openDispute } },
          { model: "order", actionLocks: { return: () => "second" } },
          { model: "product", actionLocks: { return: () => "product" } },
        ],
      },
    })
    const locked: Order = { id: "o", disputes: [{ status: "open" }] }
    const unlocked: Order = { id: "o", disputes: [{ status: "closed" }] }

    expect(registry.getActionLock("order", "return", locked)).toBe(
      "Item under dispute"
    )
    expect(registry.getActionLock("order", "return", unlocked)).toBe("second")
    expect(registry.getActionLock("order", "exchange", locked)).toBeUndefined()
  })

  test("merges activity entries across a model's configs", () => {
    const registry = new ExtensionRegistry({
      customFields: {
        configs: [
          {
            model: "order",
            activity: () => [{ title: "Dispute opened", timestamp: "2026-01-01" }],
          },
          {
            model: "order",
            activity: () => [{ title: "Dispute resolved", timestamp: "2026-01-02" }],
          },
          { model: "customer", activity: () => [{ title: "x", timestamp: "2026-01-03" }] },
        ],
      },
    })

    expect(registry.getActivity("order", {}).map((e) => e.title)).toEqual([
      "Dispute opened",
      "Dispute resolved",
    ])
  })

  describe("layered custom-fields configs", () => {
    const Plugin = () => null
    const Host = () => null

    test("a later column with the same id replaces an added one in place", () => {
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "product",
              list: {
                columns: [
                  { id: "brand", header: "Brand", component: Plugin },
                  { id: "erp", header: "ERP" },
                ],
              },
            },
            {
              model: "product",
              list: { columns: [{ id: "brand", header: "Maker", component: Host }] },
            },
          ],
        },
      })

      const { columns } = registry.getListExtension("product")
      expect(columns).toEqual([
        { id: "brand", header: "Maker", component: Host },
        { id: "erp", header: "ERP" },
      ])
    })

    test("view defaults from later configs take precedence", () => {
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "product",
              list: {
                viewDefaults: {
                  columnVisibility: { brand: true, sku: false },
                  columnOrder: ["brand", "title"],
                },
              },
            },
            {
              model: "product",
              list: {
                viewDefaults: {
                  columnVisibility: { brand: false },
                  columnOrder: ["title", "brand"],
                },
              },
            },
          ],
        },
      })

      const { viewDefaults } = registry.getListExtension("product")
      expect(viewDefaults).toEqual({
        columnVisibility: { brand: false, sku: false },
        columnOrder: ["title", "brand"],
      })
    })

    test("a later filter replaces or removes an added filter by key", () => {
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "product",
              list: {
                filters: [
                  { key: "brand", label: "Brand", type: "string" },
                  { key: "erp_id", label: "ERP", type: "string" },
                ],
              },
            },
            {
              model: "product",
              list: {
                filters: [
                  { key: "brand", label: "Maker", type: "string" },
                  { key: "erp_id", remove: true },
                ],
              },
            },
          ],
        },
      })

      expect(registry.getListExtension("product").filters).toEqual([
        { key: "brand", label: "Maker", type: "string" },
        { key: "erp_id", remove: true },
      ])
    })

    test("a later display field replaces or removes an added field by id", () => {
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "product",
              displays: [
                {
                  zone: "general",
                  fields: [
                    { id: "title", component: Plugin },
                    { id: "brand", component: Plugin },
                    { id: "erp", component: Plugin },
                  ],
                },
              ],
            },
            {
              model: "product",
              displays: [
                {
                  zone: "general",
                  fields: [
                    { id: "title", component: Host },
                    { id: "brand", component: Host },
                    { id: "erp", component: null },
                  ],
                },
              ],
            },
          ],
        },
      })

      expect(registry.getDisplays("product", "general").fields).toEqual([
        { id: "title", component: Host },
        { id: "brand", component: Host },
        { id: "erp", component: null },
      ])
    })

    test("a later form field with the same name replaces an added one", () => {
      const validation = {}
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "product",
              forms: [
                {
                  zone: "create",
                  tab: "general",
                  fields: {
                    brand: { validation, label: "Brand" },
                    erp: { validation, label: "ERP" },
                  },
                },
              ],
            },
            {
              model: "product",
              forms: [
                {
                  zone: "create",
                  tab: "general",
                  fields: { brand: { validation, label: "Maker" } },
                },
                { zone: "edit", fields: { erp: { validation, label: "ERP id" } } },
              ],
            },
          ],
        },
      })

      const labels = (fields: { name: string; field: { label?: string } }[]) =>
        fields.map(({ name, field }) => [name, field.label])

      expect(labels(registry.getFormFields("product", "create", "general"))).toEqual([
        ["brand", "Maker"],
      ])
      expect(labels(registry.getFormFields("product", "edit"))).toEqual([
        ["erp", "ERP id"],
      ])
      expect(labels(registry.getAllFormFields("product"))).toEqual([
        ["brand", "Maker"],
        ["erp", "ERP id"],
      ])
    })
  })

  describe("getOnboardingSteps", () => {
    const builtIns = [
      { id: "store", rank: 10, optional: false, required: true },
      { id: "address", rank: 20, optional: true },
      { id: "company", rank: 30, optional: true },
      { id: "payment", rank: 40, optional: true },
    ]

    const ids = (steps: { id: string }[]) => steps.map((step) => step.id)

    test("returns the built-in steps when nothing is configured", () => {
      const registry = new ExtensionRegistry()

      expect(ids(registry.getOnboardingSteps("seller", builtIns))).toEqual([
        "store",
        "address",
        "company",
        "payment",
      ])
    })

    test("adds, removes, reorders and flags steps from onboarding form entries", () => {
      const validation = {}
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            {
              model: "seller",
              forms: [
                { zone: "onboarding", tab: "address", fields: { region: { validation } } },
                {
                  zone: "onboarding",
                  tab: "documents",
                  label: "Documents",
                  rank: 25,
                  optional: true,
                  fields: { vat: { validation } },
                },
                { zone: "onboarding", tab: "company", disabled: true },
                { zone: "onboarding", tab: "payment", optional: false },
                { zone: "onboarding", tab: "terms", label: "Terms" },
                { zone: "edit", tab: "ignored", label: "Not onboarding" },
              ],
            },
          ],
        },
      })

      const steps = registry.getOnboardingSteps("seller", builtIns)

      expect(ids(steps)).toEqual(["store", "address", "documents", "payment", "terms"])
      expect(steps.find((step) => step.id === "documents")).toEqual({
        id: "documents",
        label: "Documents",
        rank: 25,
        optional: true,
        custom: true,
      })
      expect(steps.find((step) => step.id === "payment")?.optional).toBe(false)
      expect(steps.find((step) => step.id === "terms")).toMatchObject({
        custom: true,
        optional: false,
      })
      expect(
        registry.getFormFields("seller", "onboarding", "documents").map((f) => f.name)
      ).toEqual(["vat"])
    })

    test("ignores attempts to disable a required step", () => {
      const registry = new ExtensionRegistry({
        customFields: {
          configs: [
            { model: "seller", forms: [{ zone: "onboarding", tab: "store", disabled: true }] },
          ],
        },
      })

      expect(ids(registry.getOnboardingSteps("seller", builtIns))[0]).toEqual("store")
    })
  })
})
