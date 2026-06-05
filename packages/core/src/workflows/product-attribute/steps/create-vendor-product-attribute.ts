import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CreateVendorProductAttributeDTO } from "@mercurjs/types"

import {
  VENDOR_PRODUCT_ATTRIBUTE_MODULE,
  VendorProductAttributeModuleService,
} from "../../../modules/vendor-product-attribute"

export const createVendorProductAttributeStepId =
  "create-vendor-product-attribute"

export const createVendorProductAttributeStep = createStep(
  createVendorProductAttributeStepId,
  async (input: CreateVendorProductAttributeDTO, { container }) => {
    const vendorProductAttributeService =
      container.resolve<VendorProductAttributeModuleService>(
        VENDOR_PRODUCT_ATTRIBUTE_MODULE
      )

    const created =
      await vendorProductAttributeService.createVendorProductAttributes(
        input
      )

    return new StepResponse(created, created.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }

    const vendorProductAttributeService =
      container.resolve<VendorProductAttributeModuleService>(
        VENDOR_PRODUCT_ATTRIBUTE_MODULE
      )
    await vendorProductAttributeService.deleteVendorProductAttributes(id)
  }
)
