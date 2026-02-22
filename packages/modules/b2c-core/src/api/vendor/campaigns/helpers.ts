import { AuthenticatedMedusaRequest, MedusaRequest } from '@medusajs/framework'
import type { MedusaContainer, PromotionDTO } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { VendorGetCampaignByIdParamsType } from './validators'

export async function getFilteredCampaignPromotions(
  container: MedusaContainer,
  campaignId: string,
  filters: AuthenticatedMedusaRequest<{}, VendorGetCampaignByIdParamsType>['validatedQuery'],
  fields: string[],
  pagination?: MedusaRequest['queryConfig']['pagination']
): Promise<PromotionDTO[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const shouldIncludePromotions =
    fields.includes('*') ||
    fields.some(
      (field: string) =>
        field === '*promotions' ||
        field === 'promotions' ||
        field.startsWith('promotions.')
    )

  if (!shouldIncludePromotions) {
    return []
  }

  const promotionFilters: Record<string, any> = {
    campaign_id: campaignId
  }

  if (filters.created_at) {
    promotionFilters.created_at = filters.created_at
  }

  if (filters.updated_at) {
    promotionFilters.updated_at = filters.updated_at
  }

  if (filters?.q && filters?.q?.length > 0) {
    promotionFilters.code = { $ilike: `%${filters.q}%` }
  }

  const { data: promotions } = await query.graph({
    entity: 'promotion',
    fields: ['*'],
    filters: promotionFilters,
    pagination
  })

  return promotions || []
}

