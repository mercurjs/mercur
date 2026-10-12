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
