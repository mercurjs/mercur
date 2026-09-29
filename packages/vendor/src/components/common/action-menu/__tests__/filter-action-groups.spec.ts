import { describe, expect, test } from "vitest"

import { filterActionGroups } from "../filter-action-groups"
import type { Action, ActionGroup } from "../action-menu"

const icon = null as never

const check = (granted: string[]) => ({
  hasAnyPermission: (required: string[]) =>
    required.some((permission) => granted.includes(permission)),
  hasAllPermissions: (required: string[]) =>
    required.every((permission) => granted.includes(permission)),
})

const groups = (...actions: Partial<ActionGroup["actions"][number]>[]) =>
  [{ actions: actions as ActionGroup["actions"] }] as ActionGroup[]

describe("filterActionGroups", () => {
  test("keeps actions that declare no permission", () => {
    const result = filterActionGroups(
      groups({ icon, label: "Go", to: "somewhere" }),
      check([])
    )

    expect(result[0].actions).toHaveLength(1)
  })

  test("drops an action the actor lacks", () => {
    const result = filterActionGroups(
      groups({ icon, label: "Delete", onClick: () => {}, permission: "products:manage" }),
      check(["products:view"])
    )

    expect(result).toEqual([])
  })

  test("keeps an action the actor holds", () => {
    const result = filterActionGroups(
      groups({ icon, label: "Edit", to: "edit", permission: "products:edit" }),
      check(["products:edit"])
    )

    expect(result[0].actions).toHaveLength(1)
  })

  test("requireAll needs every permission", () => {
    const action: Partial<Action> = {
      icon,
      label: "Move",
      to: "move",
      permission: ["products:edit", "stock_locations:edit"],
      requireAll: true,
    }

    expect(filterActionGroups(groups(action), check(["products:edit"]))).toEqual([])
    expect(
      filterActionGroups(
        groups(action),
        check(["products:edit", "stock_locations:edit"])
      )[0].actions
    ).toHaveLength(1)
  })

  test("defaults to ANY across multiple permissions", () => {
    const result = filterActionGroups(
      groups({
        icon,
        label: "Move",
        to: "move",
        permission: ["products:edit", "stock_locations:edit"],
      }),
      check(["stock_locations:edit"])
    )

    expect(result[0].actions).toHaveLength(1)
  })

  test("drops a group once all of its actions are filtered out", () => {
    const result = filterActionGroups(
      [
        { actions: [{ icon, label: "Edit", to: "edit", permission: "products:edit" }] },
        { actions: [{ icon, label: "View", to: "view" }] },
      ] as ActionGroup[],
      check([])
    )

    expect(result).toHaveLength(1)
    expect(result[0].actions[0].label).toEqual("View")
  })

  // Public routes mount no PermissionsProvider; the menu must still render.
  test("filters nothing when there is no permissions context", () => {
    const result = filterActionGroups(
      groups({ icon, label: "Delete", onClick: () => {}, permission: "products:manage" }),
      null
    )

    expect(result[0].actions).toHaveLength(1)
  })
})
