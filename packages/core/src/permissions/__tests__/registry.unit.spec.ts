import { PermissionDefinition } from "@mercurjs/types"

import {
  getPermissionCatalog,
  grantAll,
  satisfiesRight,
  validatePermissionCatalog,
} from ".."

const define = (
  key: string,
  extra: Partial<PermissionDefinition> = {}
): PermissionDefinition => ({
  key,
  group: "test",
  surface: ["admin"],
  rights: ["view", "edit"],
  ...extra,
})

describe("permission catalog", () => {
  it("registers the core catalog and it is valid", () => {
    const catalog = getPermissionCatalog()

    expect(catalog.map((p) => p.key)).toEqual(
      expect.arrayContaining(["orders", "orders.refunds", "payouts", "sellers"])
    )
    expect(() => validatePermissionCatalog(catalog)).not.toThrow()
  })

  it("rejects a requirement on an unknown permission", () => {
    expect(() =>
      validatePermissionCatalog([
        define("a", { requires: [{ key: "missing", right: "view" }] }),
      ])
    ).toThrow(/unknown permission "missing"/)
  })

  it("rejects a requirement on a right the target does not have", () => {
    expect(() =>
      validatePermissionCatalog([
        define("a", { requires: [{ key: "b", right: "manage" }] }),
        define("b"),
      ])
    ).toThrow(/not a right of "b"/)
  })

  it("rejects dependency cycles", () => {
    expect(() =>
      validatePermissionCatalog([
        define("a", { requires: [{ key: "b", right: "view" }] }),
        define("b", { requires: [{ key: "a", right: "view" }] }),
      ])
    ).toThrow(/cycle/)
  })
})

describe("rights", () => {
  it("nests manage > edit > view", () => {
    expect(satisfiesRight("manage", "view")).toBe(true)
    expect(satisfiesRight("edit", "view")).toBe(true)
    expect(satisfiesRight("view", "edit")).toBe(false)
    expect(satisfiesRight(undefined, "view")).toBe(false)
  })

  it("grantAll gives each permission its highest right", () => {
    expect(
      grantAll([define("a"), define("b", { rights: ["view", "edit", "manage"] })])
    ).toEqual({ a: "edit", b: "manage" })
  })
})
