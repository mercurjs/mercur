import { CreatePromotionDTO } from '@medusajs/framework/types'
import { MedusaError } from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

export const verifyVendorPromotionStep = createStep(
  'verify-vendor-promotion',
  async (input: { promotion: CreatePromotionDTO; seller_id: string }) => {
    const target_type = input.promotion.application_method.target_type
    if (target_type !== 'items') {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Invalid Vendor Promotion target_type!'
      )
    }
  }
)
