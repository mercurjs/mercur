import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  promiseAll,
} from "@medusajs/framework/utils"

type RequestType = "edit" | "return" | "exchange" | "claim"

const isOpenOrderChange = { status: ["requested", "pending"] }
const isRequestedStatus = { status: "requested" }

export const applyRequestFilter = async (
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const request = filterableFields.request as RequestType[] | undefined

  if (!request || request.length === 0) {
    return next()
  }

  delete filterableFields.request

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const wantsEdit = request.includes("edit")
  const wantsReturn = request.includes("return")
  const wantsExchange = request.includes("exchange")
  const wantsClaim = request.includes("claim")

  const emptyResult = Promise.resolve({ data: [] as { order_id: string }[] })

  const [editRes, returnRes, exchangeRes, claimRes] = await promiseAll([
    wantsEdit
      ? query.graph({
          entity: "order_change",
          fields: ["order_id"],
          filters: { ...isOpenOrderChange, change_type: "edit" },
        })
      : emptyResult,
    wantsReturn
      ? query.graph({
          entity: "return",
          fields: ["order_id"],
          filters: isRequestedStatus,
        })
      : emptyResult,
    wantsExchange
      ? query.graph({
          entity: "order_exchange",
          fields: ["order_id"],
          filters: isRequestedStatus,
        })
      : emptyResult,
    wantsClaim
      ? query.graph({
          entity: "order_claim",
          fields: ["order_id"],
          filters: isRequestedStatus,
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

  const existingId = filterableFields.id

  if (matchingOrderIds.length === 0) {
    filterableFields.id = { $in: [""] }
  } else if (existingId !== undefined) {
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
