import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

/**
 * `lazy: () => import("./pages/x")` hands the whole module to React Router, so
 * every `loader` / `handle` / `Component` it exports becomes part of the route.
 * A barrel that star-exports a child page leaks that page's loader onto the
 * parent route, where it runs for members who can't access the child.
 */

const ROUTE_EXPORTS = [
  "loader",
  "action",
  "handle",
  "Component",
  "ErrorBoundary",
  "HydrateFallback",
  "shouldRevalidate",
]

const src = path.resolve(__dirname, "..")

const resolveModule = (from: string, specifier: string) => {
  const base = path.resolve(from, specifier)
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]
  const file = candidates.find((candidate) => fs.existsSync(candidate))

  if (!file) {
    throw new Error(`Cannot resolve ${specifier} from ${from}`)
  }

  return file
}

const isDirectoryIndex = (file: string) => /^index\.tsx?$/.test(path.basename(file))

const starTargets = (file: string) =>
  [
    ...fs
      .readFileSync(file, "utf-8")
      .matchAll(/^export \* from ["']([^"']+)["']/gm),
  ].map((match) => resolveModule(path.dirname(file), match[1]))

const exportedNames = (file: string, seen = new Set<string>()): Set<string> => {
  const names = new Set<string>()

  if (seen.has(file)) {
    return names
  }
  seen.add(file)

  const source = fs.readFileSync(file, "utf-8")

  for (const match of source.matchAll(
    /^export (?:async )?(?:const|let|var|function|class) (\w+)/gm
  )) {
    names.add(match[1])
  }

  for (const match of source.matchAll(/^export \{([^}]*)\}/gm)) {
    match[1]
      .split(",")
      .map((entry) => entry.trim().split(/\s+as\s+/).pop())
      .filter((name): name is string => !!name)
      .forEach((name) => names.add(name))
  }

  for (const target of starTargets(file)) {
    exportedNames(target, seen).forEach((name) => names.add(name))
  }

  return names
}

const leakedRouteExports = (entry: string) =>
  starTargets(entry)
    .filter(isDirectoryIndex)
    .flatMap((target) =>
      ROUTE_EXPORTS.filter((name) => exportedNames(target).has(name)).map(
        (name) => `${name} from ${path.relative(src, target)}`
      )
    )

const lazyModules = [
  ...new Set(
    [
      ...fs
        .readFileSync(path.join(src, "get-route-map.tsx"), "utf-8")
        .matchAll(/lazy:\s*\(\)\s*=>\s*import\(\s*"(\.\/pages\/[^"]+)"\s*\)/g),
    ].map((match) => match[1])
  ),
]

describe("lazily imported route modules", () => {
  test("the route map lazy-loads page modules", () => {
    expect(lazyModules.length).toBeGreaterThan(0)
  })

  test("none inherit route exports from a child page", () => {
    const leaks = lazyModules.flatMap((specifier) =>
      leakedRouteExports(resolveModule(src, specifier)).map(
        (leak) => `${specifier}: ${leak}`
      )
    )

    expect(leaks).toEqual([])
  })

  test("the /settings index route has no loader", () => {
    const routeMap = fs.readFileSync(path.join(src, "get-route-map.tsx"), "utf-8")
    const specifier = routeMap.match(
      /path: "\/settings",[\s\S]*?index: true,[\s\S]*?import\("([^"]+)"\)/
    )?.[1]

    expect(specifier).toBeDefined()
    expect(exportedNames(resolveModule(src, specifier!)).has("loader")).toBe(
      false
    )
  })
})
