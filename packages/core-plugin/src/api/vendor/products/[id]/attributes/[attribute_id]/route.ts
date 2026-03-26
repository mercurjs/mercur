import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { AttributeSource, AttributeUIComponent } from "@mercurjs/types"

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../../../../modules/attribute"
import sellerAttributeLink from "../../../../../../links/seller-attribute-link"
import { VendorUpdateProductAttributeType } from "../../../validators"
import { transformProductWithInformationalAttributes } from "../../../utils/transform-product-attributes"
import { convertAttributeToOptionWorkflow } from "../../../../../../workflows/product-attribute/workflows/convert-attribute-to-option"
import { deleteAttributeValueWorkflow } from "../../../../../../workflows/product-attribute/workflows/delete-attribute-value"
import { syncProductAttributeValuesWorkflow } from "../../../../../../workflows/product-attribute/workflows/sync-product-attribute-values"
import { getProductAttributeValues } from "../utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const attributeService =
    req.scope.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)
  const { id: product_id, attribute_id } = req.params
  const { name, ui_component, values, use_for_variations } =
    req.validatedBody

  const sellerId = req.auth_context.actor_id

  const {
    data: [attribute],
  } = await query.graph({
    entity: "attribute",
    fields: [
      "id",
      "name",
      "source",
      "is_filterable",
      "possible_values.value",
    ],
    filters: { id: attribute_id },
  })

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attribute_id}' not found`
    )
  }

  if (
    (name || ui_component) &&
    attribute.source !== AttributeSource.VENDOR
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot edit admin-defined attribute properties"
    )
  }

  if (attribute.source === AttributeSource.VENDOR) {
    const {
      data: [ownershipLink],
    } = await query.graph({
      entity: sellerAttributeLink.entryPoint,
      fields: ["attribute_id"],
      filters: {
        seller_id: sellerId,
        attribute_id: attribute_id,
      },
    })

    if (!ownershipLink) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You do not own this attribute"
      )
    }
  }

  if (use_for_variations === true) {
    const attributeValues = await getProductAttributeValues(
      req.scope,
      product_id,
      attribute_id
    )

    const currentValues = attributeValues.map((av) => av.value)
    const valueIds = attributeValues.map((av) => av.attribute_value_id)

    await convertAttributeToOptionWorkflow(req.scope).run({
      input: {
        product_id,
        seller_id: sellerId,
        option_title: attribute.name,
        option_values: values ?? currentValues,
        attribute_value_ids: valueIds,
      },
    })
  } else {
    if (
      attribute.source === AttributeSource.VENDOR &&
      (name || ui_component)
    ) {
      await attributeService.updateAttributes({
        id: attribute_id,
        ...(name && { name }),
        ...(ui_component && {
          ui_component: ui_component as AttributeUIComponent,
        }),
      })
    }

    if (values) {
      const attributeValues = await getProductAttributeValues(
        req.scope,
        product_id,
        attribute_id
      )

      await syncProductAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          seller_id: sellerId,
          attribute_id,
          attribute_source: attribute.source,
          possible_values:
            attribute.possible_values?.map(
              (pv: { value: string }) => pv.value
            ) ?? [],
          new_values: values,
          existing_values: attributeValues.map((value) => ({
            attribute_value_id: value.attribute_value_id,
            value: value.value,
          })),
        },
      })
    }
  }

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: product_id },
  })

  const transformedProduct = transformProductWithInformationalAttributes(
    product as any
  )

  res.json({ product: transformedProduct })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id: product_id, attribute_id } = req.params

  const sellerId = req.auth_context.actor_id

  const {
    data: [attribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["id", "source", "is_required"],
    filters: { id: attribute_id },
  })

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attribute_id}' not found`
    )
  }

  if (
    attribute.source === AttributeSource.ADMIN &&
    attribute.is_required
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot remove required attributes"
    )
  }

  if (attribute.source === AttributeSource.VENDOR) {
    const {
      data: [ownershipLink],
    } = await query.graph({
      entity: sellerAttributeLink.entryPoint,
      fields: ["attribute_id"],
      filters: {
        seller_id: sellerId,
        attribute_id: attribute_id,
      },
    })

    if (!ownershipLink) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You do not own this attribute"
      )
    }
  }

  const attributeValues = await getProductAttributeValues(
    req.scope,
    product_id,
    attribute_id
  )

  const valuesToRemove = attributeValues.map(
    (av) => av.attribute_value_id
  )

  if (valuesToRemove.length > 0) {
    await deleteAttributeValueWorkflow(req.scope).run({
      input: valuesToRemove,
    })
  }

  res.json({
    product_id,
    attribute_id,
    deleted: true,
    removed_values_count: valuesToRemove.length,
  })
}
