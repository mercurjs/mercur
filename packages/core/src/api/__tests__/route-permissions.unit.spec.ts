jest.mock("sanitize-html", () =>
  Object.assign(
    jest.fn((value: string) => value),
    { simpleTransform: jest.fn() }
  )
)

import fs from "fs"
import path from "path"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PermissionRequirement } from "@mercurjs/types"

import { adminMiddlewares } from "../admin/middlewares"
import { vendorMiddlewares } from "../vendor/middlewares"
import {
  enforceCoreRoutePermissions,
  matchCoreRoutePermission,
  normalizeAdminPath,
} from "../admin/core-route-permissions"
import { REQUIRED_PERMISSION } from "../utils/permissions-middleware"
import { getPermission } from "../../permissions"

const API_DIR = path.join(__dirname, "..")
const METHODS = ["GET", "POST", "DELETE"] as const

// Reachable without a seller context or intentionally self-service.
const VENDOR_EXEMPT = [
  /^\/vendor\/sellers$/,
  /^\/vendor\/sellers\/select$/,
  /^\/vendor\/sellers\/me$/,
  /^\/vendor\/stores$/,
  /^\/vendor\/feature-flags$/,
  /^\/vendor\/members\/me$/,
  /^\/vendor\/members\/invites\/accept$/,
]

type RouteFile = { file: string; path: string; methods: string[] }

const crawl = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : crawl(full)
    }
    return entry.name === "route.ts" ? [full] : []
  })

const routeFiles = (surface: "admin" | "vendor"): RouteFile[] =>
  crawl(path.join(API_DIR, surface)).map((file) => {
    const content = fs.readFileSync(file, "utf-8")
    const url =
      "/" +
      path
        .relative(API_DIR, path.dirname(file))
        .replace(/\\/g, "/")
        .replace(/\[([^\]]+)\]/g, "sample_$1")

    return {
      file,
      path: url,
      methods: METHODS.filter((method) =>
        new RegExp(`export\\s+(const|async function|function)\\s+${method}\\b`).test(content)
      ),
      authenticated: !/export\s+const\s+AUTHENTICATE\s*=\s*false/.test(content),
    }
  }).filter((route) => route.authenticated) as RouteFile[]

const matcherToRegex = (matcher: string | RegExp): RegExp => {
  if (matcher instanceof RegExp) {
    return matcher
  }
  const source = matcher
    .split("/")
    .map((segment) =>
      segment === "*"
        ? ".*"
        : segment.startsWith(":")
          ? "[^/]+"
          : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*")
    )
    .join("/")
  return new RegExp(`^${source}$`)
}

const routeRequirements = (
  routes: MiddlewareRoute[],
  url: string,
  method: string
): PermissionRequirement[] =>
  routes
    .filter((route) => {
      const methods = route.method
        ? Array.isArray(route.method)
          ? route.method
          : [route.method]
        : undefined
      return (
        (!methods || methods.includes(method as never)) &&
        matcherToRegex(route.matcher as string | RegExp).test(url)
      )
    })
    .flatMap((route) => route.middlewares ?? [])
    .map(
      (middleware) =>
        (middleware as unknown as Record<symbol, PermissionRequirement | undefined>)[
          REQUIRED_PERMISSION
        ]
    )
    .filter((requirement): requirement is PermissionRequirement => !!requirement)

describe("route permissions", () => {
  it("every authenticated vendor route declares a permission", () => {
    const missing = routeFiles("vendor").flatMap((route) =>
      VENDOR_EXEMPT.some((pattern) => pattern.test(route.path))
        ? []
        : route.methods
            .filter(
              (method) =>
                !routeRequirements(vendorMiddlewares, route.path, method).length
            )
            .map((method) => `${method} ${route.path}`)
    )

    expect(missing).toEqual([])
  })

  it("every Mercur admin route declares a permission", () => {
    const missing = routeFiles("admin").flatMap((route) =>
      route.methods
        .filter(
          (method) =>
            !routeRequirements(adminMiddlewares, route.path, method).length &&
            matchCoreRoutePermission(route.path, method) === undefined
        )
        .map((method) => `${method} ${route.path}`)
    )

    expect(missing).toEqual([])
  })

  it("only references permissions that exist for the surface", () => {
    const unknown = (["admin", "vendor"] as const).flatMap((surface) => {
      const routes = surface === "admin" ? adminMiddlewares : vendorMiddlewares
      return routes
        .flatMap((route) => route.middlewares ?? [])
        .map(
          (middleware) =>
            (middleware as unknown as Record<symbol, PermissionRequirement | undefined>)[
              REQUIRED_PERMISSION
            ]
        )
        .filter((requirement): requirement is PermissionRequirement => !!requirement)
        .filter((requirement) => {
          const definition = getPermission(requirement.key)
          return (
            !definition ||
            !definition.surface.includes(surface) ||
            !definition.rights.includes(requirement.right)
          )
        })
        .map((requirement) => `${surface} ${requirement.key}:${requirement.right}`)
    })

    expect([...new Set(unknown)]).toEqual([])
  })

  it("covers every core Medusa admin route family", () => {
    const medusaAdminDir = path.join(
      path.dirname(
        require.resolve("@medusajs/medusa/api/admin/orders/query-config")
      ),
      ".."
    )
    const families = fs
      .readdirSync(medusaAdminDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

    const uncovered = families.filter(
      (family) =>
        matchCoreRoutePermission(`/admin/${family}`, "POST") === undefined
    )

    expect(uncovered).toEqual([])
  })

  it("matches case, encoding and slash variants of a core route", () => {
    expect(normalizeAdminPath("/admin//Products/?limit=1")).toEqual(
      "/admin/products"
    )
    expect(normalizeAdminPath("/admin/%50roducts/prod_1/")).toEqual(
      "/admin/products/prod_1"
    )
    expect(normalizeAdminPath("/admin/%E0%A4%A")).toEqual("/admin/%E0%A4%A")

    for (const variant of [
      "/admin/Products",
      "/admin/PRODUCTS/",
      "/admin//products",
      "/admin/%50roducts",
    ]) {
      expect(matchCoreRoutePermission(variant, "POST")).toEqual({
        key: "products",
        right: "edit",
      })
    }
  })

  it("guards the whole orders subtree", () => {
    expect(matchCoreRoutePermission("/admin/orders/order_1", "GET")).toEqual({
      key: "orders",
      right: "view",
    })
    expect(
      matchCoreRoutePermission("/admin/orders/order_1/fulfillments", "POST")
    ).toEqual({ key: "orders", right: "edit" })
    expect(
      matchCoreRoutePermission("/admin/orders/order_1/refund", "POST")
    ).toEqual({ key: "orders.refunds", right: "edit" })
    expect(
      matchCoreRoutePermission("/admin/draft-orders/order_1", "DELETE")
    ).toEqual({ key: "orders", right: "manage" })
    expect(matchCoreRoutePermission("/admin/order-edits", "POST")).toEqual({
      key: "orders.edits",
      right: "edit",
    })
    expect(
      matchCoreRoutePermission("/admin/returns/return_1/receive", "POST")
    ).toEqual({ key: "orders.returns", right: "edit" })
    expect(matchCoreRoutePermission("/admin/claims", "GET")).toEqual({
      key: "orders.returns",
      right: "view",
    })
    expect(
      matchCoreRoutePermission("/admin/exchanges/exc_1", "DELETE")
    ).toEqual({ key: "orders.returns", right: "manage" })
    expect(
      matchCoreRoutePermission("/admin/fulfillments/ful_1/cancel", "POST")
    ).toEqual({ key: "fulfillment_sets", right: "edit" })
  })

  describe("enforceCoreRoutePermissions", () => {
    const run = (
      url: string,
      method: string,
      permissions: Record<string, string>
    ) => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      const next = jest.fn()
      const req = {
        originalUrl: url,
        method,
        permissions,
        permissions_enforced: true,
      }

      enforceCoreRoutePermissions(
        req as never,
        res as unknown as Parameters<typeof enforceCoreRoutePermissions>[1],
        next
      )

      return { res, next }
    }

    it("denies a case variant of a guarded core route", () => {
      const { res, next } = run("/admin/Products", "POST", { orders: "view" })

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ permission: "products", right: "edit" })
      )
    })

    it("passes Mercur-owned routes to their own guards", () => {
      const { next } = run("/admin/sellers", "GET", { sellers: "view" })

      expect(next).toHaveBeenCalled()
    })

    it("fails closed on unknown admin paths for an actor without grants", () => {
      const { res, next } = run("/admin/not-a-route", "GET", {})

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it("accepts any of the shared permissions on uploads", () => {
      expect(run("/admin/uploads", "POST", { sellers: "edit" }).next).toHaveBeenCalled()

      const denied = run("/admin/uploads", "POST", { orders: "view" })
      expect(denied.next).not.toHaveBeenCalled()
      expect(denied.res.status).toHaveBeenCalledWith(403)
    })
  })

  it("lets an admin read and edit their own profile without users permissions", () => {
    expect(matchCoreRoutePermission("/admin/users/me", "GET")).toBeNull()
    expect(matchCoreRoutePermission("/admin/users/me", "POST")).toBeNull()
    expect(matchCoreRoutePermission("/admin/users/user_1", "POST")).toEqual({
      key: "users",
      right: "edit",
    })
  })

  it("lets any admin read the store but gates writes", () => {
    expect(matchCoreRoutePermission("/admin/stores", "GET")).toBeNull()
    expect(matchCoreRoutePermission("/admin/stores/store_1", "GET")).toBeNull()
    expect(matchCoreRoutePermission("/admin/stores/store_1", "POST")).toEqual({
      key: "store",
      right: "edit",
    })
    expect(
      matchCoreRoutePermission("/admin/stores/store_1/locales", "GET")
    ).toEqual({ key: "store", right: "view" })
  })
})
