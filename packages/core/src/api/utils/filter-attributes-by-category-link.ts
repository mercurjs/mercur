import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Replacement for `maybeApplyLinkFilter` on the
 * `category_owning_attribute` link. When a category filter is present,
 * the default helper restricts the result to attribute IDs linked to
 * that category, which silently drops "global" attributes (those that
 * have no category link at all). Marketplace operators and vendors
 * expect a category-scoped attribute list to also surface global
 * attributes, so this middleware composes:
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

  const { data: linkedToCategory } = await query.graph({
    entity: "category_owning_attribute",
    fields: ["product_attribute_id"],
    filters: { product_category_id: categoryIds },
  })
  const linkedToCategoryIds = Array.from(
    new Set(linkedToCategory.map((l: any) => l.product_attribute_id))
  )

  const { data: anyLinked } = await query.graph({
    entity: "category_owning_attribute",
    fields: ["product_attribute_id"],
  })
  const anyLinkedIds = Array.from(
    new Set(anyLinked.map((l: any) => l.product_attribute_id))
  )

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
