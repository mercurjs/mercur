import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type CategoryRef = { id?: string | null }
type AttributeWithCategories = {
  id: string
  // The remote joiner may return a single object instead of an array when an
  // attribute has exactly one category link, so accept both shapes.
  categories?: CategoryRef | CategoryRef[] | null
}

/**
 * Replacement for `maybeApplyLinkFilter` on the product-attribute ↔
 * category link (`product-attribute-category-link`, surfaced on the
 * attribute as the `categories` relation). When a category filter is
 * present, the default helper restricts the result to attribute IDs
 * linked to that category, which silently drops "global" attributes
 * (those that have no category link at all). Marketplace operators and
 * vendors expect a category-scoped attribute list to also surface
 * global attributes, so this middleware composes:
 *
 *   id IN (attribute IDs linked to the requested category)
 *   OR
 *   id NOT IN (any attribute that has at least one category link)
 *
 * The second clause is what brings global attributes back in.
 */
export const filterAttributesByCategoryLinkOrGlobal = async (
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const categoryFilter = filterableFields.product_category_id

  if (!categoryFilter) {
    return next()
  }

  delete filterableFields.product_category_id

  const categoryIds = Array.isArray(categoryFilter)
    ? categoryFilter
    : [categoryFilter]

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: attributes } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "categories.id"],
  })

  const categoryIdSet = new Set(categoryIds)
  const linkedToCategoryIds: string[] = []
  const anyLinkedIds: string[] = []

  for (const attribute of attributes as AttributeWithCategories[]) {
    const raw = attribute.categories
    const categoryLinks: CategoryRef[] = Array.isArray(raw)
      ? raw
      : raw
        ? [raw]
        : []
    if (categoryLinks.length === 0) {
      continue
    }
    anyLinkedIds.push(attribute.id)
    if (
      categoryLinks.some((c) => c?.id != null && categoryIdSet.has(c.id))
    ) {
      linkedToCategoryIds.push(attribute.id)
    }
  }

  const orClause = [
    { id: linkedToCategoryIds },
    { id: { $nin: anyLinkedIds } },
  ]

  const existingId = filterableFields.id
  if (existingId !== undefined) {
    filterableFields.$and = [{ id: existingId }, { $or: orClause }]
    delete filterableFields.id
  } else {
    filterableFields.$or = orClause
  }

  req.filterableFields = filterableFields

  return next()
}
