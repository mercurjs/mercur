import { describe, expect, test } from "vitest"

import {
  applyActionPermissions,
  filterCommandsByPermission,
} from "../action-permissions"
import {
  isForbidden,
  isPermitted,
  permissionMapAllows,
} from "../permission-check"

const check = (granted: string[]) => ({
  hasAnyPermission: (required: string[]) =>
    required.some((permission) => granted.includes(permission)),
  hasAllPermissions: (required: string[]) =>
    required.every((permission) => granted.includes(permission)),
})

const TOOLTIP = "denied"

describe("applyActionPermissions", () => {
  test("leaves actions that declare no permission untouched", () => {
    const groups = [{ actions: [{ label: "Go" }] }]

    expect(applyActionPermissions(groups, check([]), TOOLTIP)).toEqual(groups)
  })

  test("disables an action the actor lacks, with the tooltip", () => {
    const [group] = applyActionPermissions(
      [{ actions: [{ label: "Delete", permission: "products:manage" as const }] }],
      check(["products:view"]),
      TOOLTIP
    )

    expect(group.actions[0]).toMatchObject({
      disabled: true,
      disabledTooltip: TOOLTIP,
    })
  })

  test("keeps an action the actor holds enabled", () => {
    const [group] = applyActionPermissions(
      [{ actions: [{ label: "Edit", permission: "products:edit" as const }] }],
      check(["products:edit"]),
      TOOLTIP
    )

    expect(group.actions[0].disabled).toBeUndefined()
  })

  test("requireAll needs every permission", () => {
    const groups = [
      {
        actions: [
          {
            label: "Move",
            permission: ["products:edit", "stock_locations:edit"] as const,
            requireAll: true,
          },
        ],
      },
    ]
    const disabled = (granted: string[]) =>
      applyActionPermissions(
        groups as never,
        check(granted),
        TOOLTIP
      )[0].actions[0].disabled

    expect(disabled(["products:edit"])).toBe(true)
    expect(disabled(["products:edit", "stock_locations:edit"])).toBeUndefined()
  })

  test("changes nothing without a provider", () => {
    const groups = [
      { actions: [{ label: "Delete", permission: "products:manage" as const }] },
    ]

    expect(applyActionPermissions(groups, null, TOOLTIP)).toEqual(groups)
  })
})

describe("filterCommandsByPermission", () => {
  const commands = [
    { label: "Edit", shortcut: "e" },
    { label: "Delete", shortcut: "d", permission: "offers:manage" as const },
  ]

  test("drops commands the actor lacks and strips the permission keys", () => {
    expect(filterCommandsByPermission(commands, check([]))).toEqual([
      { label: "Edit", shortcut: "e" },
    ])
  })

  test("keeps everything without a provider", () => {
    expect(filterCommandsByPermission(commands, null)).toHaveLength(2)
  })
})

describe("permission checks", () => {
  test("isPermitted passes when nothing is required or enforced", () => {
    expect(isPermitted(check([]), undefined)).toBe(true)
    expect(isPermitted(null, "orders:edit")).toBe(true)
    expect(isPermitted(check([]), "orders:edit")).toBe(false)
  })

  test("permissionMapAllows honours nested rights", () => {
    expect(permissionMapAllows({ orders: "manage" }, "orders:edit")).toBe(true)
    expect(permissionMapAllows({ orders: "view" }, "orders:edit")).toBe(false)
    expect(permissionMapAllows(null, "orders:edit")).toBe(true)
    expect(
      permissionMapAllows({ offers: "view" }, ["offers:view", "products:view"])
    ).toBe(false)
  })

  test("isForbidden matches only a 403", () => {
    expect(isForbidden({ status: 403 })).toBe(true)
    expect(isForbidden({ status: 404 })).toBe(false)
    expect(isForbidden(undefined)).toBe(false)
  })
})
