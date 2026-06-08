import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  promiseAll,
} from "@medusajs/framework/utils"

export const applyHasOpenRequestFilter = async (
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const hasOpenRequest = filterableFields.has_open_request

  if (hasOpenRequest === undefined) {
    return next()
  }

  delete filterableFields.has_open_request

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [changesRes, returnsRes] = await promiseAll([
    query.graph({
      entity: "order_change",
      fields: ["order_id"],
      filters: { status: ["requested", "pending"] },
    }),
    query.graph({
      entity: "return",
      fields: ["order_id"],
      filters: { status: "requested" },
    }),
  ])

  const openOrderIds = Array.from(
    new Set<string>([
      ...changesRes.data.map((c: { order_id: string }) => c.order_id),
      ...returnsRes.data.map((r: { order_id: string }) => r.order_id),
    ])
  )

  const existingId = filterableFields.id

  if (hasOpenRequest) {
    if (openOrderIds.length === 0) {
      filterableFields.id = { $in: [""] }
    } else if (existingId !== undefined) {
      filterableFields.$and = [
        { id: existingId },
        { id: { $in: openOrderIds } },
      ]
      delete filterableFields.id
    } else {
      filterableFields.id = { $in: openOrderIds }
    }
  } else {
    if (openOrderIds.length > 0) {
      if (existingId !== undefined) {
        filterableFields.$and = [
          { id: existingId },
          { id: { $nin: openOrderIds } },
        ]
        delete filterableFields.id
      } else {
        filterableFields.id = { $nin: openOrderIds }
      }
    }
  }

  req.filterableFields = filterableFields

  return next()
}
