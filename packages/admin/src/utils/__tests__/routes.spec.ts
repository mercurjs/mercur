import { RouteObject } from "react-router-dom"
import type { RouteHandle } from "@mercurjs/dashboard-sdk"
import { describe, expect, test, vi } from "vitest"

vi.mock("../../components/utilities/error-boundary", () => ({
  ErrorBoundary: () => null,
}))

const { createRouteMap } = await import("../routes")

const Component = () => null
const listCrumb = () => "Roles"
const detailCrumb = () => "Role"

const find = (routes: RouteObject[] | undefined, path: string) =>
  routes?.find((r) => r.path === path)

const leafHandle = async (route: RouteObject | undefined) => {
  const lazy = route?.lazy as (() => Promise<{ handle?: RouteHandle }>) | undefined
  return (await lazy?.())?.handle
}

describe("createRouteMap breadcrumbs", () => {
  test("list page crumb moves to the branch and is not duplicated", async () => {
    const [roles] = createRouteMap(
      [{ path: "/settings/roles", Component, handle: { breadcrumb: listCrumb } }],
      "/settings"
    )

    expect((roles.handle as RouteHandle).breadcrumb).toBe(listCrumb)
    expect(await leafHandle(find(roles.children, ""))).toBeUndefined()
  })

  test("detail page matches both the domain crumb and its own", async () => {
    const [roles] = createRouteMap(
      [
        { path: "/settings/roles", Component, handle: { breadcrumb: listCrumb } },
        { path: "/settings/roles/:id", Component, handle: { breadcrumb: detailCrumb } },
      ],
      "/settings"
    )

    const id = find(roles.children, ":id")
    expect((roles.handle as RouteHandle).breadcrumb).toBe(listCrumb)
    expect((id?.handle as RouteHandle | undefined)?.breadcrumb).toBe(detailCrumb)
    expect(await leafHandle(find(id?.children, ""))).toBeUndefined()
  })

  test("permissions stay on the index leaf", async () => {
    const [roles] = createRouteMap(
      [
        {
          path: "/settings/roles",
          Component,
          handle: { breadcrumb: listCrumb, permissions: "role:read" } as RouteHandle,
        },
      ],
      "/settings"
    )

    expect(roles.handle).toEqual({ breadcrumb: listCrumb })
    expect(await leafHandle(find(roles.children, ""))).toEqual({ permissions: "role:read" })
  })

  test("a segment without an index page gets no branch handle", async () => {
    const [ee] = createRouteMap(
      [
        { path: "/settings/ee/tos", Component, handle: { breadcrumb: () => "ToS" } },
        { path: "/settings/ee/dispute-reasons", Component, handle: { breadcrumb: () => "DR" } },
      ],
      "/settings"
    )

    expect(ee.handle).toBeUndefined()
    expect(find(ee.children, "tos")?.handle).toBeDefined()
  })
})
