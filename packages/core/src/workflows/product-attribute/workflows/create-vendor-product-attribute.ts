import { LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

import { AttributeUIComponent } from "@mercurjs/types"

import { VENDOR_PRODUCT_ATTRIBUTE_MODULE } from "../../../modules/vendor-product-attribute"
import { MercurModules } from "@mercurjs/types"

import { createVendorProductAttributeStep } from "../steps/create-vendor-product-attribute"

export const createVendorProductAttributeWorkflowId =
  "create-vendor-product-attribute"

export interface CreateVendorProductAttributeWorkflowInput {
  name: string
  value: string
  product_id: string
  seller_id: string
  ui_component?: AttributeUIComponent
  extends_attribute_id?: string
  rank?: number
  metadata?: Record<string, unknown>
}

export const createVendorProductAttributeWorkflow = createWorkflow(
  createVendorProductAttributeWorkflowId,
  (input: CreateVendorProductAttributeWorkflowInput) => {
    const vendorProductAttributeInput = transform(
      { input },
      ({ input }) => ({
        name: input.name,
        value: input.value,
        ui_component: input.ui_component,
        extends_attribute_id: input.extends_attribute_id,
        rank: input.rank ?? 0,
        metadata: input.metadata,
      })
    )

    const vendorProductAttribute = createVendorProductAttributeStep(
      vendorProductAttributeInput
    )

    const links = transform(
      { input, vendorProductAttribute },
      ({ input, vendorProductAttribute }): LinkDefinition[] => [
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id,
          },
          [VENDOR_PRODUCT_ATTRIBUTE_MODULE]: {
            vendor_product_attribute_id: vendorProductAttribute.id,
          },
        },
        {
          [MercurModules.SELLER]: {
            seller_id: input.seller_id,
          },
          [VENDOR_PRODUCT_ATTRIBUTE_MODULE]: {
            vendor_product_attribute_id: vendorProductAttribute.id,
          },
        },
      ]
    )

    createRemoteLinkStep(links)

    return new WorkflowResponse(vendorProductAttribute)
  }
)
