import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  AttributeSource,
  AttributeUIComponent,
} from "@mercurjs/types"

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute"
import { MercurModules } from "@mercurjs/types"

interface FindOrCreateVendorAttributeInput {
  sellerId: string
  name: string
  ui_component?: AttributeUIComponent
}

function generateVendorAttributeHandle(
  sellerId: string,
  name: string
): string {
  const sellerSuffix = sellerId.slice(-8)
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `vendor_${sellerSuffix}_${slug}`
}

export async function findOrCreateVendorAttribute(
  container: MedusaContainer,
  input: FindOrCreateVendorAttributeInput
): Promise<{ id: string; name: string; isNew: boolean }> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const attributeService =
    container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)
  const linkService = container.resolve(ContainerRegistrationKeys.LINK)

  const normalizedName = input.name.trim()
  const handle = generateVendorAttributeHandle(
    input.sellerId,
    normalizedName
  )

  const {
    data: [existingAttribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["id", "name"],
    filters: {
      source: AttributeSource.VENDOR,
      handle,
    },
  })

  if (existingAttribute) {
    return {
      id: existingAttribute.id,
      name: existingAttribute.name,
      isNew: false,
    }
  }

  const newAttribute = await attributeService.createAttributes({
    name: normalizedName,
    handle,
    source: AttributeSource.VENDOR,
    is_filterable: false,
    is_required: false,
    ui_component: input.ui_component ?? AttributeUIComponent.TEXTAREA,
  })

  await linkService.create({
    [MercurModules.SELLER]: { seller_id: input.sellerId },
    [ATTRIBUTE_MODULE]: { attribute_id: newAttribute.id },
  })

  return {
    id: newAttribute.id,
    name: newAttribute.name,
    isNew: true,
  }
}
