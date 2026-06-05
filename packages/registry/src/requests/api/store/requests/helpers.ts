import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"
import type { CustomFieldsModuleService } from "@mercurjs/core/modules/custom-fields"

export function excludePendingRequestEntities(alias: string) {
  return async function (
    req: MedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) {
    const customFieldsService = req.scope.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    const pendingRows = await customFieldsService.list(alias, {
      request_status: 'pending',
    }, {})

    const pendingIds = pendingRows.map((row: Record<string, string>) => row[`${alias}_id`])

    if (pendingIds.length > 0) {
      const existingIdFilter = req.filterableFields.id

      if (existingIdFilter) {
        // If there's already an id filter, intersect with non-pending
        const existingIds = Array.isArray(existingIdFilter)
          ? existingIdFilter
          : [existingIdFilter]

        req.filterableFields.id = existingIds.filter(
          (id) => !pendingIds.includes(id as string)
        )
      } else {
        req.filterableFields.id = { $nin: pendingIds }
      }
    }

    return next()
  }
}
