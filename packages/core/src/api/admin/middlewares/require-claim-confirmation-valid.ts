import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

/**
 * Mercur claim-confirmation invariants. Medusa baseline rejects the
 * same cases but with generic copy and no error code, so the admin UI
 * cannot map the rejection to flow-specific feedback. This middleware
 * short-circuits with deterministic codes:
 *
 *   - `CLAIM_REQUIRES_INBOUND_ITEMS` — confirmation attempted with no
 *     inbound (return) items on the claim. Medusa workflow throws
 *     "Order claim request should have at least 1 item".
 *   - `CLAIM_REQUIRES_LOCATION` — inbound items present but no return
 *     `location_id` selected on the claim. Medusa accepts the
 *     confirmation but the receive-return path then breaks because
 *     the location is missing — surface the rule pre-confirm so the
 *     admin sees the cause immediately.
 *
 * Matcher: /admin/claims/:id/request  (:id is the CLAIM id.)
 *
 * Method dispatch is internal: only POST gates the confirmation; GETs
 * (preview) bypass to avoid disturbing read paths.
 */
export const requireClaimConfirmationValid = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    if (req.method !== "POST") {
      return next()
    }

    const params = req.params as { id?: unknown }
    const claimId = params.id
    if (typeof claimId !== "string" || claimId.length === 0) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: claims } = await query.graph({
      entity: "order_claim",
      fields: [
        "id",
        "claim_items.id",
        "return.id",
        "return.location_id",
      ],
      filters: { id: claimId },
    })
    type ClaimRow = {
      id: string
      claim_items?: Array<{ id: string }>
      return?: { id?: string; location_id?: string | null } | null
    }
    const claim = claims?.[0] as ClaimRow | undefined

    // Claim missing → let the downstream route surface its own 404.
    if (!claim) {
      return next()
    }

    if (!claim.claim_items || claim.claim_items.length === 0) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Please add at least one item from the order before confirming the claim.",
          "CLAIM_REQUIRES_INBOUND_ITEMS"
        )
      )
    }

    // Inbound items exist; require a return location.
    if (!claim.return?.location_id) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Please choose a return location before confirming the claim.",
          "CLAIM_REQUIRES_LOCATION"
        )
      )
    }

    return next()
  } catch (e) {
    return next(e as Error)
  }
}
