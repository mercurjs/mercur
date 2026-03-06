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
    const alias = req.params.type!

    const filters: Record<string, string | string[]> = {}

    if (req.filterableFields.request_status) {
      filters.request_status = req.filterableFields.request_status as string | string[]
      delete req.filterableFields.request_status
    }

    if (req.filterableFields.submitter_id) {
      filters.submitter_id = req.filterableFields.submitter_id as string | string[]
      delete req.filterableFields.submitter_id
    }

    const customFieldRows = await customFieldsService.list(alias, filters, {})

    const entityIds = customFieldRows.map((row) => row[`${alias}_id`])

    req.filterableFields.id = entityIds

    return next()
  }
}
