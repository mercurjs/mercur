import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

/**
 * The sidebar hides a link using ROUTE_PERMISSIONS; the router refuses the
 * route using the `handle` declared in get-route-map. If the two disagree a
 * section is either visible-but-unreachable, or hidden-but-reachable by URL.
 */

const vendorSrc = path.resolve(__dirname, "../../..")

const read = (file: string) => fs.readFileSync(path.join(vendorSrc, file), "utf-8")

const routeMapPermissions = new Set(
  [...read("get-route-map.tsx").matchAll(/permissions: "([a-z_]+:[a-z*]+)"/g)].map(
    (m) => m[1]
  )
)

const navPermissions = new Set(
  [
    ...read("lib/permissions/route-permissions.ts").matchAll(
      /: "([a-z_]+:[a-z*]+)",$/gm
    ),
  ].map((m) => m[1])
)

describe("vendor sidebar and route map agree", () => {
  test("every nav permission is enforced by a route", () => {
    const missing = [...navPermissions].filter(
      (permission) => !routeMapPermissions.has(permission)
    )

    expect(missing).toEqual([])
  })

  test("the nav map declares at least one gated section", () => {
    expect(navPermissions.size).toBeGreaterThan(0)
  })
})
