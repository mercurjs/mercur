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
