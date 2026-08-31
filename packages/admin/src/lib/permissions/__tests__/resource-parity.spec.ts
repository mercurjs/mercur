import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

/**
 * `PermissionResource` (dashboard-sdk) and the policies registered server-side
 * are two hand-maintained lists that have to agree. A name present in only one
 * of them is not a type error — a guard for an unregistered resource simply
 * never matches a granted policy, so it fails silently and permanently.
 */

const repoRoot = path.resolve(__dirname, "../../../../../..")

const readResources = (file: string): string[] => {
  const source = fs.readFileSync(file, "utf-8")
  return [...source.matchAll(/"([a-z_]+)"/g)].map((match) => match[1])
}

const readDir = (dir: string): string[] =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) => readResources(path.join(dir, file)))

const OPERATIONS = new Set(["read", "create", "update", "delete"])

const registeredResources = new Set(
  readDir(path.join(repoRoot, "packages/core/src/policies")).filter(
    (name) => !OPERATIONS.has(name)
  )
)

const unionResources = (() => {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages/dashboard-sdk/src/permissions.ts"),
    "utf-8"
  )
  const union = source.slice(
    source.indexOf("export type PermissionResource ="),
    source.indexOf("export type PermissionOperation")
  )
  return new Set([...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]))
})()

const routeResources = (() => {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages/core/src/api/utils/policy-resources.ts"),
    "utf-8"
  )
  return new Set([...source.matchAll(/^\s+\w+: "([a-z_]+)",$/gm)].map((m) => m[1]))
})()

const routeMapPermissions = (() => {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages/admin/src/get-route-map.tsx"),
    "utf-8"
  )
  return new Set(
    [...source.matchAll(/permissions: "([a-z_]+:[a-z*]+)"/g)].map((m) => m[1])
  )
})()

const navPermissions = (() => {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages/admin/src/lib/permissions/route-permissions.ts"),
    "utf-8"
  )
  return new Set(
    [...source.matchAll(/: "([a-z_]+:[a-z*]+)",$/gm)].map((m) => m[1])
  )
})()

describe("sidebar and route map agree", () => {
  // The sidebar hides a link using ROUTE_PERMISSIONS; the router refuses the
  // route using the `handle` declared in get-route-map. If they disagree a
  // section is either visible-but-unreachable or hidden-but-reachable.
  test("every nav permission is enforced by a route", () => {
    const missing = [...navPermissions].filter(
      (permission) => !routeMapPermissions.has(permission)
    )

    expect(missing).toEqual([])
  })
})

describe("permission resource parity", () => {
  test("every Mercur-registered policy resource is in PermissionResource", () => {
    const missing = [...registeredResources].filter(
      (name) => !unionResources.has(name)
    )

    expect(missing).toEqual([])
  })

  test("every resource named by a route policy is in PermissionResource", () => {
    const missing = [...routeResources].filter(
      (name) => !unionResources.has(name)
    )

    expect(missing).toEqual([])
  })

  test("PermissionResource has no duplicates", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, "packages/dashboard-sdk/src/permissions.ts"),
      "utf-8"
    )
    const union = source.slice(
      source.indexOf("export type PermissionResource ="),
      source.indexOf("export type PermissionOperation")
    )
    const all = [...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1])

    expect(all.length).toEqual(new Set(all).size)
  })
})
