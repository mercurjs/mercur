import { describe, expect, test } from "vitest"

import { ExtensionRegistry } from "./registry"

type Order = { id: string; disputes?: { status: string }[] }

const openDispute = (entity: unknown) =>
  (entity as Order).disputes?.some((d) => d.status === "open")
    ? "Item under dispute"
    : undefined

describe("ExtensionRegistry", () => {
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
})
