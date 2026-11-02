import { LinkDefinition } from "@medusajs/framework/types"

export type LinkDirectionLookup = (
  moduleA: string,
  moduleAKey: string,
  moduleB: string,
  moduleBKey: string
) => unknown

/**
 * Link definitions are plain objects whose module order decides which link
 * module `Link.dismiss` resolves. Workflow state persisted in a `jsonb`
 * column comes back with its keys sorted, so a compensation that replays the
 * stored links can end up asking for a `cart-order` link that only exists
 * as `order-cart`. Swap the two modules back when only the reverse pair is
 * registered.
 */
export const orderLinkModules = (
  link: LinkDefinition,
  hasLinkModule: LinkDirectionLookup
): LinkDefinition => {
  const modules = Object.keys(link).filter((key) => key !== "data")
  if (modules.length !== 2) {
    return link
  }

  const [moduleA, moduleB] = modules
  const keyA = Object.keys(link[moduleA]).join(",")
  const keyB = Object.keys(link[moduleB]).join(",")

  if (
    hasLinkModule(moduleA, keyA, moduleB, keyB) ||
    !hasLinkModule(moduleB, keyB, moduleA, keyA)
  ) {
    return link
  }

  const reordered: LinkDefinition = {
    [moduleB]: link[moduleB],
    [moduleA]: link[moduleA],
  }
  if ("data" in link) {
    reordered.data = link.data
  }
  return reordered
}
