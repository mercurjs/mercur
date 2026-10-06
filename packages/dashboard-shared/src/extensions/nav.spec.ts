import { describe, expect, test } from "vitest"

import { applyNavGroups, groupNavItems, type NavGroup } from "./nav"

const item = (to: string) => ({ id: to.replace(/^\//, ""), label: to, to })

const coreGroups = (): NavGroup[] => [
  {
    id: "general",
    label: "General",
    items: [item("/settings/users"), item("/settings/regions")],
  },
  {
    id: "developer",
    label: "Developer",
    items: [item("/settings/secret-api-keys")],
  },
  { id: "myAccount", label: "My Account", items: [item("/settings/profile")] },
]

const shape = (groups: NavGroup[]) =>
  groups.map((g) => [g.id, g.items.map((i) => i.to)])

describe("applyNavGroups", () => {
  test("returns the built-in groups unchanged without config", () => {
    expect(shape(applyNavGroups(coreGroups()))).toEqual([
      ["general", ["/settings/users", "/settings/regions"]],
      ["developer", ["/settings/secret-api-keys"]],
      ["myAccount", ["/settings/profile"]],
    ])
  })

  test("lists extension routes in their group, defaulting to the first", () => {
    const groups = applyNavGroups(coreGroups(), [
      { ...item("/settings/webhooks"), group: "developer", rank: 2 },
      { ...item("/settings/audit"), group: "developer", rank: 1 },
      item("/settings/erp"),
      { ...item("/settings/typo"), group: "nope" },
    ])

    expect(shape(groups)).toEqual([
      [
        "general",
        [
          "/settings/users",
          "/settings/regions",
          "/settings/erp",
          "/settings/typo",
        ],
      ],
      [
        "developer",
        ["/settings/secret-api-keys", "/settings/audit", "/settings/webhooks"],
      ],
      ["myAccount", ["/settings/profile"]],
    ])
  })

  test("declares a new group and moves built-in items into it", () => {
    const groups = applyNavGroups(
      coreGroups(),
      [{ ...item("/settings/erp"), group: "integrations" }],
      {
        groups: [
          { id: "integrations", label: "nav.integrations", translationNs: "erp", rank: 1 },
        ],
        items: [{ id: "settings/secret-api-keys", group: "integrations" }],
      }
    )

    expect(shape(groups)).toEqual([
      ["general", ["/settings/users", "/settings/regions"]],
      ["integrations", ["/settings/secret-api-keys", "/settings/erp"]],
      ["myAccount", ["/settings/profile"]],
    ])
    expect(groups[1]).toMatchObject({
      label: "nav.integrations",
      translationNs: "erp",
    })
  })

  test("appends new groups after the built-ins and falls back to the id as label", () => {
    const groups = applyNavGroups(coreGroups(), [], {
      groups: [{ id: "billing" }],
      items: [{ id: "settings/regions", group: "billing" }],
    })

    expect(groups.map((g) => [g.id, g.label])).toEqual([
      ["general", "General"],
      ["developer", "Developer"],
      ["myAccount", "My Account"],
      ["billing", "billing"],
    ])
  })

  test("overrides a built-in group's label, rank and visibility", () => {
    const groups = applyNavGroups(coreGroups(), [], {
      groups: [
        { id: "myAccount", rank: -1 },
        { id: "developer", hidden: true },
        { id: "general", label: "Marketplace" },
      ],
    })

    expect(groups.map((g) => [g.id, g.label])).toEqual([
      ["myAccount", "My Account"],
      ["general", "Marketplace"],
    ])
  })

  test("applies rank, hidden and label overrides to items", () => {
    const groups = applyNavGroups(coreGroups(), [], {
      items: [
        { id: "settings/regions", rank: -1, label: "Markets" },
        { id: "settings/secret-api-keys", hidden: true },
      ],
    })

    expect(groups.map((g) => [g.id, g.items.map((i) => i.label)])).toEqual([
      ["general", ["Markets", "/settings/users"]],
      ["myAccount", ["/settings/profile"]],
    ])
  })
})

describe("groupNavItems", () => {
  const items = [
    { to: "/orders" },
    { to: "/products", group: "catalog" },
    { to: "/payouts", group: "finance" },
    { to: "/inventory", group: "catalog" },
    { to: "/reviews", group: "undeclared" },
    { to: "/secret", group: "internal" },
  ]

  test("keeps everything ungrouped without declared groups", () => {
    expect(groupNavItems(items)).toEqual({ ungrouped: items, groups: [] })
  })

  test("splits items into declared groups ordered by rank", () => {
    const result = groupNavItems(items, [
      { id: "catalog", label: "Catalog" },
      { id: "finance", rank: -1 },
      { id: "internal", hidden: true },
      { id: "empty", label: "Empty" },
    ])

    expect(result.ungrouped.map((i) => i.to)).toEqual(["/orders", "/reviews"])
    expect(
      result.groups.map((g) => [g.id, g.label, g.items.map((i) => i.to)])
    ).toEqual([
      ["finance", "finance", ["/payouts"]],
      ["catalog", "Catalog", ["/products", "/inventory"]],
    ])
  })
})
