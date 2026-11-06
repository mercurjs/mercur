import { createElement, type ComponentType, type ReactNode } from "react"

export type RenderDefaultProps = { renderDefault?: () => ReactNode }

type LayeredRoute = {
  Component: ComponentType<RenderDefaultProps>
  path: string
  children?: LayeredRoute[]
}

const normalize = (path: string) => {
  let start = 0
  let end = path.length
  while (start < end && path.charCodeAt(start) === 47) start++
  while (end > start && path.charCodeAt(end - 1) === 47) end--
  return path.slice(start, end)
}

function override<T extends LayeredRoute>(previous: T, next: T): T {
  const Previous = previous.Component
  const Next = next.Component
  const Component = (props: RenderDefaultProps) =>
    createElement(Next, {
      ...props,
      renderDefault: () => createElement(Previous, { renderDefault: props.renderDefault }),
    })
  Component.displayName = Next.displayName ?? Next.name ?? "RouteOverride"

  return {
    ...next,
    path: previous.path,
    Component,
    children: next.children
      ? resolveRouteOverrides([...(previous.children ?? []), ...next.children])
      : previous.children,
  }
}

type LazyModule = {
  Component?: ComponentType<RenderDefaultProps> | null
  handle?: unknown
}

const mergeHandles = (previous: unknown, next: unknown) =>
  previous && next && typeof previous === "object" && typeof next === "object"
    ? { ...previous, ...next }
    : (next ?? previous)

/**
 * Overrides a built-in page's lazy route with an extension's, handing the
 * built-in component to the extension as `renderDefault`. The built-in loader
 * is kept unless the extension declares its own, so `renderDefault` still has
 * the data it reads.
 */
export function overrideLazyRoute<T extends LazyModule>(
  previous: () => Promise<T>,
  next: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const [base, custom] = await Promise.all([previous(), next()])
    const Previous = base.Component
    const Next = custom.Component

    if (!Previous || !Next) {
      return { ...base, ...custom }
    }

    const Component = (props: RenderDefaultProps) =>
      createElement(Next, { ...props, renderDefault: () => createElement(Previous) })
    Component.displayName = Next.displayName ?? Next.name ?? "RouteOverride"

    return { ...base, ...custom, Component, handle: mergeHandles(base.handle, custom.handle) }
  }
}

/**
 * Collapses routes emitted in layer order so the last route at a path wins and
 * receives the previous page as `renderDefault`. Parallel (modal) children at
 * the same path resolve the same way; a later route without children keeps the
 * earlier route's.
 */
export function resolveRouteOverrides<T extends LayeredRoute>(routes: T[]): T[] {
  const byPath = new Map<string, T>()

  for (const route of routes) {
    const key = normalize(route.path)
    const previous = byPath.get(key)
    byPath.set(key, previous ? override(previous, route) : route)
  }

  return [...byPath.values()]
}
