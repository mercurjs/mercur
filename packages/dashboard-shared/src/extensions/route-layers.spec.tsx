import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"
import { resolveRouteOverrides, type RenderDefaultProps } from "./route-layers"

const Core = () => createElement("p", null, "core")
const Plugin = ({ renderDefault }: RenderDefaultProps) =>
  createElement("section", null, "plugin", renderDefault?.() as ReactNode)
const Project = ({ renderDefault }: RenderDefaultProps) =>
  createElement("main", null, "project", renderDefault?.() as ReactNode)

describe("resolveRouteOverrides", () => {
  test("last route at a path wins and renders the previous one through renderDefault", () => {
    const routes = resolveRouteOverrides([
      { path: "/disputes", Component: Core },
      { path: "/reports", Component: Core },
      { path: "/disputes", Component: Plugin },
      { path: "disputes/", Component: Project },
    ])

    expect(routes.map((r) => r.path)).toEqual(["/disputes", "/reports"])
    expect(renderToStaticMarkup(createElement(routes[0].Component))).toBe(
      "<main>project<section>plugin<p>core</p></section></main>"
    )
  })

  test("children are kept from the earlier route unless the later one declares its own", () => {
    const [route] = resolveRouteOverrides([
      { path: "/disputes", Component: Core, children: [{ path: "/disputes/edit", Component: Core }] },
      { path: "/disputes", Component: Plugin },
    ])
    expect(route.children?.map((c) => c.path)).toEqual(["/disputes/edit"])

    const [merged] = resolveRouteOverrides([
      { path: "/disputes", Component: Core, children: [{ path: "/disputes/edit", Component: Core }] },
      { path: "/disputes", Component: Plugin, children: [{ path: "/disputes/edit", Component: Plugin }, { path: "/disputes/cancel", Component: Plugin }] },
    ])
    expect(merged.children?.map((c) => c.path)).toEqual(["/disputes/edit", "/disputes/cancel"])
    expect(renderToStaticMarkup(createElement(merged.children![0].Component))).toBe(
      "<section>plugin<p>core</p></section>"
    )
  })
})
