import { Link } from "@medusajs/framework/modules-sdk"
import { LinkDefinition } from "@medusajs/framework/types"

import { orderLinkModules } from "./link-order"

export const dismissLinks = async (link: Link, links: LinkDefinition[]) => {
  if (!links.length) {
    return
  }

  const lookup = (a: string, aKey: string, b: string, bKey: string) =>
    link.getLinkModule(a, aKey, b, bKey)

  await link.dismiss(links.map((entry) => orderLinkModules(entry, lookup)))
}
