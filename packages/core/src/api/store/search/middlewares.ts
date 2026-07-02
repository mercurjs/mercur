import {
  authenticate,
  MedusaNextFunction,
  MedusaResponse,
  MedusaStoreRequest,
  MiddlewareRoute,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"
import { MedusaPricingContext } from "@medusajs/framework/types"
import { validateAndTransformBody } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { StoreSearchSchema, StoreSearchType } from "./validators"

type StoreSearchRequest = MedusaStoreRequest<StoreSearchType> & {
  pricingContext?: MedusaPricingContext
  taxContext?: {
    taxLineContext?: { address?: { country_code?: string; province_code?: string } }
    taxInclusivityContext?: { automaticTaxes: boolean }
  }
}

// Mirrors the /store/products setPricingContext + setTaxContext chain: the
// region is refetched (never trusted from the body), customer groups come from
// the auth context, and tax context derives from the region's automatic-taxes
// setting. With no region_id the search runs without pricing and hits carry
// calculated_price: null.
const setSearchPricingContext = async (
  req: StoreSearchRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const body = req.validatedBody
  const regionId = body?.region_id
  if (!regionId) {
    return next()
  }

  try {
    const region = await refetchEntity({
      entity: "region",
      idOrFilter: regionId,
      scope: req.scope,
      fields: ["id", "currency_code", "automatic_taxes"],
      options: { cache: { enable: true } },
    })

    if (!region) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Region with id ${regionId} not found when populating the pricing context`
      )
    }

    const pricingContext: MedusaPricingContext = {
      region_id: region.id,
      currency_code: region.currency_code,
    }

    if (req.auth_context?.actor_id) {
      const { data: customerGroups } = await refetchEntities({
        entity: "customer_group",
        idOrFilter: { customers: { id: req.auth_context.actor_id } },
        scope: req.scope,
        fields: ["id"],
      })
      pricingContext.customer = {
        groups: customerGroups.map((cg: { id: string }) => ({ id: cg.id })),
      }
    }

    req.pricingContext = pricingContext

    if (region.automatic_taxes && body?.country_code) {
      req.taxContext = {
        taxInclusivityContext: { automaticTaxes: true },
        taxLineContext: {
          address: {
            country_code: body.country_code,
            province_code: body.province,
          },
        },
      }
    }

    return next()
  } catch (e) {
    return next(e)
  }
}

export const storeSearchMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/search",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformBody(StoreSearchSchema),
      setSearchPricingContext,
    ],
  },
]
