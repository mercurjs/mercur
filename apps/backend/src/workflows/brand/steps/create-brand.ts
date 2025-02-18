import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { BRAND_MODULE } from '../../../modules/brand'
import BrandModuleService from '../../../modules/brand/service'
import { CreateBrandDTO } from '../../../modules/brand/types/mutations'

export const createBrandStep = createStep(
  'create-brand',
  async (input: CreateBrandDTO, { container }) => {
    const service = container.resolve<BrandModuleService>(BRAND_MODULE)

    let [brand] = await service.listBrands({ name: input.brand_name })

    if (!brand) {
      brand = await service.createBrands({ name: input.brand_name })
    }

    return new StepResponse(brand, brand.id)
  },
  async (brandId: string, { container }) => {
    const service = container.resolve<BrandModuleService>(BRAND_MODULE)
    await service.deleteBrands(brandId)
  }
)
