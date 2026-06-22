import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  promiseAll,
} from "@medusajs/framework/utils"

type RequestType = "edit" | "return" | "exchange" | "claim"

const isOpenOrderChange = { status: ["requested", "pending"] }
const isRequestedStatus = { status: "requested" }

const respondEmpty = (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pagination = (req.queryConfig?.pagination ?? {}) as {
    skip?: number
    take?: number
  }
  res.json({
    orders: [],
    count: 0,
    offset: pagination.skip ?? 0,
    limit: pagination.take ?? 0,
  })
}

export const applyRequestFilter = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const request = filterableFields.request as RequestType[] | undefined

  if (!request || request.length === 0) {
    return next()
  }

  delete filterableFields.request

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Scope every lookup to orders the calling seller owns. Otherwise we
  // scan every open order_change/return/exchange/claim row in the
  // marketplace and only filter by seller after the join.
  const { data: sellerLinks } = await query.graph({
    entity: "order_seller",
    fields: ["order_id"],
    filters: { seller_id: req.seller_context!.seller_id },
  })
  const sellerOrderIds = sellerLinks.map(
    (l: { order_id: string }) => l.order_id
  )

  if (sellerOrderIds.length === 0) {
    return respondEmpty(req, res)
  }

  const wantsEdit = request.includes("edit")
  const wantsReturn = request.includes("return")
  const wantsExchange = request.includes("exchange")
  const wantsClaim = request.includes("claim")

  const emptyResult = Promise.resolve({ data: [] as { order_id: string }[] })

  // `return` carries its own `status` column, so it is queried directly.
  // `order_claim`/`order_exchange` do NOT have a status field — their open
  // state lives on the associated `order_change` row (change_type
  // "claim"/"exchange"). Filtering those entities by status throws, so we
  // resolve claim/exchange through `order_change`, exactly like "edit".
  const [editRes, returnRes, exchangeRes, claimRes] = await promiseAll([
    wantsEdit
      ? query.graph({
          entity: "order_change",
          fields: ["order_id"],
          filters: {
            ...isOpenOrderChange,
            change_type: "edit",
            order_id: sellerOrderIds,
          },
        })
      : emptyResult,
    wantsReturn
      ? query.graph({
          entity: "return",
          fields: ["order_id"],
          filters: { ...isRequestedStatus, order_id: sellerOrderIds },
        })
      : emptyResult,
    wantsExchange
      ? query.graph({
          entity: "order_change",
          fields: ["order_id"],
          filters: {
            ...isOpenOrderChange,
            change_type: "exchange",
            order_id: sellerOrderIds,
          },
        })
      : emptyResult,
    wantsClaim
      ? query.graph({
          entity: "order_change",
          fields: ["order_id"],
          filters: {
            ...isOpenOrderChange,
            change_type: "claim",
            order_id: sellerOrderIds,
          },
        })
      : emptyResult,
  ])

  const matchingOrderIds = Array.from(
    new Set<string>([
      ...editRes.data.map((c: { order_id: string }) => c.order_id),
      ...returnRes.data.map((r: { order_id: string }) => r.order_id),
      ...exchangeRes.data.map((e: { order_id: string }) => e.order_id),
      ...claimRes.data.map((c: { order_id: string }) => c.order_id),
    ])
  )

  if (matchingOrderIds.length === 0) {
    return respondEmpty(req, res)
  }

  const existingId = filterableFields.id

  if (existingId !== undefined) {
    filterableFields.$and = [
      { id: existingId },
      { id: { $in: matchingOrderIds } },
    ]
    delete filterableFields.id
  } else {
    filterableFields.id = { $in: matchingOrderIds }
  }

  req.filterableFields = filterableFields

  return next()
}
