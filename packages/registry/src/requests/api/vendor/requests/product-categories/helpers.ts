import { MedusaNextFunction, AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"
import type { CustomFieldsModuleService } from "@mercurjs/core-plugin/modules/custom-fields"

export function applyRequestCustomFieldsFilter() {
  return async function (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) {
    const customFieldsService = req.scope.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    const filters: Record<string, string | string[]> = {
      submitter_id: req.auth_context!.actor_id,
    }

    if (req.filterableFields.request_status) {
      filters.request_status = req.filterableFields.request_status as string | string[]
      delete req.filterableFields.request_status
    }

    const customFieldRows = await customFieldsService.list("product_category", filters, {})

    const entityIds = customFieldRows.map((row) => row["product_category_id"])

    req.filterableFields.id = entityIds

    return next()
  }
}
