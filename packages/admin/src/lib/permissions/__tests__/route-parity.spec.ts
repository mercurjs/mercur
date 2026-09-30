import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import { ROUTE_PERMISSIONS } from "../route-permissions"

/**
 * The sidebar hides a link using ROUTE_PERMISSIONS; the router refuses the
 * route using the `handle` declared in get-route-map. If the two disagree a
 * section is either visible-but-unreachable, or hidden-but-reachable by URL.
 */

const routeMap = fs.readFileSync(
  path.resolve(__dirname, "../../../get-route-map.tsx"),
  "utf-8"
)

const toList = (value: string | string[]) =>
  (Array.isArray(value) ? value : [value]).slice().sort()

// Handles declared on routes whose `path` is the nav path, or its last segment
// for routes nested under /settings. A segment can repeat across domains, so
// every candidate is collected.
const routeMapPermissions = (navPath: string) => {
  const segment = navPath.split("/").pop()!
  const pattern = new RegExp(
    `path: "(?:${navPath}|${segment})",[\\s\\S]{0,400}?permissions: (\\[[^\\]]*\\]|"[^"]*")`,
    "g"
  )

  return [...routeMap.matchAll(pattern)].map((match) =>
    toList(JSON.parse(match[1]))
  )
}

describe("sidebar and route map agree", () => {
  test.each(Object.entries(ROUTE_PERMISSIONS))(
    "%s is gated by the same permission in the route map",
    (navPath: string, permission: string | string[]) => {
      expect(routeMapPermissions(navPath)).toContainEqual(toList(permission))
    }
  )

  test("the nav map declares at least one gated section", () => {
    expect(Object.keys(ROUTE_PERMISSIONS).length).toBeGreaterThan(0)
  })
})
