import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createProductOptionsWorkflow } from "@medusajs/medusa/core-flows"

import { AttributeSource, AttributeUIComponent } from "@mercurjs/types"

import { createAndLinkAttributeValuesWorkflow } from "../../../../../workflows/product-attribute/workflows/create-and-link-attribute-values"
import { findOrCreateVendorAttribute } from "../../../../../workflows/product-attribute/utils/find-or-create-vendor-attribute"
import { VendorAddProductAttributeType } from "../../validators"
import { transformProductWithInformationalAttributes } from "../../utils/transform-product-attributes"
import { getProductAttributeValues } from "./utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id: product_id } = req.params
  const { attribute_id, name, values, use_for_variations, ui_component } =
    req.validatedBody

  const sellerId = req.auth_context.actor_id

  if (!attribute_id && !name) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Either attribute_id or name must be provided"
    )
  }

  if (use_for_variations) {
    const optionTitle =
      name ?? (await getAttributeName(query, attribute_id!))

    await createProductOptionsWorkflow(req.scope).run({
      input: {
        product_options: [
          {
            product_id,
            title: optionTitle,
            values,
          },
        ],
      },
    })
  } else {
    let resolvedAttributeId: string

    if (attribute_id) {
      const {
        data: [attribute],
      } = await query.graph({
        entity: "attribute",
        fields: ["id", "source", "possible_values.value"],
        filters: { id: attribute_id },
      })

      if (!attribute) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Attribute with id '${attribute_id}' not found`
        )
      }

      resolvedAttributeId = attribute.id

      const existingValues = await getProductAttributeValues(
        req.scope,
        product_id,
        resolvedAttributeId
      )
      if (existingValues.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Attribute already assigned to this product. Use UPDATE endpoint to modify values."
        )
      }

      const allowedValues = new Set(
        attribute.possible_values?.map(
          (pv: { value: string }) => pv.value
        ) ?? []
      )

      const valuesWithSource = values.map((value) => {
        const isFromPossibleValues =
          allowedValues.size === 0 || allowedValues.has(value)

        const source = isFromPossibleValues
          ? AttributeSource.ADMIN
          : AttributeSource.VENDOR

        return { value, source }
      })

      await createAndLinkAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          attribute_id: resolvedAttributeId,
          seller_id: sellerId,
          values: valuesWithSource,
        },
      })
    } else {
      const vendorAttribute = await findOrCreateVendorAttribute(
        req.scope,
        {
          sellerId,
          name: name!,
          ui_component:
            (ui_component as AttributeUIComponent) ??
            AttributeUIComponent.TEXTAREA,
        }
      )

      resolvedAttributeId = vendorAttribute.id

      const existingValues = await getProductAttributeValues(
        req.scope,
        product_id,
        resolvedAttributeId
      )
      if (existingValues.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Attribute already assigned to this product. Use UPDATE endpoint to modify values."
        )
      }

      await createAndLinkAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          attribute_id: resolvedAttributeId,
          seller_id: sellerId,
          values: values.map((value) => ({
            value,
            source: AttributeSource.VENDOR as AttributeSource,
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

  res.status(201).json({ product: transformedProduct })
}

async function getAttributeName(
  query: any,
  attributeId: string
): Promise<string> {
  const {
    data: [attribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["name"],
    filters: { id: attributeId },
  })

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attributeId}' not found`
    )
  }

  return attribute.name
}
