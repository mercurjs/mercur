import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { deleteOffersWorkflow } from "../../../../workflows/offer"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    filters: { id },
    fields: req.queryConfig.fields,
  })

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id: ${id} was not found`
    )
  }

  res.json({ offer })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    filters: { id },
    fields: ["id"],
  })

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id: ${id} was not found`
    )
  }

  await deleteOffersWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({ id, object: "offer", deleted: true })
}
