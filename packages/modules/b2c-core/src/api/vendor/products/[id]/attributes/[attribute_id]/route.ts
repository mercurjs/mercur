import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { createProductOptionsWorkflow } from "@medusajs/medusa/core-flows";

import {
  AttributeSource,
  AttributeUIComponent,
} from "@mercurjs/framework";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../../../../modules/attribute";
import { SELLER_MODULE } from "../../../../../../modules/seller";
import { fetchSellerByAuthActorId } from "../../../../../../shared/infra/http/utils";
import sellerAttributeLink from "../../../../../../links/seller-attribute";
import { VendorUpdateProductAttributeType } from "../../../validators";
import { transformProductWithInformationalAttributes } from "../../../utils/transform-product-attributes";
import { getProductAttributeValues } from "../utils";

/**
 * @oas [post] /vendor/products/{id}/attributes/{attribute_id}
 * operationId: "VendorUpdateProductAttribute"
 * summary: "Update Product Attribute"
 * description: "Updates attribute values on a product. For vendor-owned attributes, can also update name and UI component. Setting use_for_variations to true converts to an option."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: attribute_id
 *     required: true
 *     description: The ID of the Attribute.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateProductAttribute"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const attributeService =
    req.scope.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const { id: product_id, attribute_id } = req.params;
  const { name, ui_component, values, use_for_variations } = req.validatedBody;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  // Fetch attribute with its source
  const {
    data: [attribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["id", "name", "source", "is_filterable", "possible_values.value"],
    filters: { id: attribute_id },
  });

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attribute_id}' not found`
    );
  }

  // If trying to edit name/ui_component, must be vendor-owned
  if ((name || ui_component) && attribute.source !== AttributeSource.VENDOR) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot edit admin-defined attribute properties"
    );
  }

  // If vendor-owned, verify seller ownership
  if (attribute.source === AttributeSource.VENDOR) {
    const {
      data: [ownershipLink],
    } = await query.graph({
      entity: sellerAttributeLink.entryPoint,
      fields: ["attribute_id"],
      filters: {
        seller_id: seller.id,
        attribute_id: attribute_id,
      },
    });

    if (!ownershipLink) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You do not own this attribute"
      );
    }
  }

  // Handle conversion to option
  if (use_for_variations === true) {
    // Get current values for this product + attribute using efficient SQL query
    const attributeValues = await getProductAttributeValues(
      req.scope,
      product_id,
      attribute_id
    );

    const currentValues = attributeValues.map((av) => av.value);
    const valueIds = attributeValues.map((av) => av.attribute_value_id);

    // Create ProductOption
    await createProductOptionsWorkflow(req.scope).run({
      input: {
        product_options: [
          {
            product_id,
            title: attribute.name,
            values: values ?? currentValues,
          },
        ],
      },
    });

    // Remove attribute values from product
    for (const valueId of valueIds) {
      await linkService.dismiss({
        [Modules.PRODUCT]: { product_id },
        [ATTRIBUTE_MODULE]: { attribute_value_id: valueId },
      });
    }

    // Delete orphaned attribute values
    await attributeService.deleteAttributeValues(valueIds);
  } else {
    // Update attribute definition if vendor-owned and updates provided
    if (attribute.source === AttributeSource.VENDOR && (name || ui_component)) {
      await attributeService.updateAttributes({
        id: attribute_id,
        ...(name && { name }),
        ...(ui_component && { ui_component: ui_component as AttributeUIComponent }),
      });
    }

    // Update values if provided
    if (values) {
      // Get current values for this product + attribute using efficient SQL query
      const attributeValues = await getProductAttributeValues(
        req.scope,
        product_id,
        attribute_id
      );

      const currentValueMap = new Map(
        attributeValues.map((av) => [
          av.value,
          {
            id: av.attribute_value_id,
            source: av.source,
          },
        ])
      );
      const newValueSet = new Set(values);

      // Determine values to remove and add
      const toRemove: string[] = [];
      for (const [value, info] of currentValueMap) {
        if (!newValueSet.has(value)) {
          toRemove.push((info as any).id);
        }
      }

      const toAdd: string[] = [];
      for (const value of values) {
        if (!currentValueMap.has(value)) {
          toAdd.push(value);
        }
      }

      // Remove old values
      for (const valueId of toRemove) {
        await linkService.dismiss({
          [Modules.PRODUCT]: { product_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id: valueId },
        });
        await attributeService.deleteAttributeValues(valueId);
      }

      // Add new values
      const allowedValues = new Set(
        attribute.possible_values?.map((pv: { value: string }) => pv.value) ?? []
      );

      for (const value of toAdd) {
        // Determine source
        const isFromPossibleValues =
          attribute.source === AttributeSource.ADMIN &&
          allowedValues.size > 0 &&
          allowedValues.has(value);

        if (
          attribute.source === AttributeSource.ADMIN &&
          allowedValues.size > 0 &&
          !allowedValues.has(value)
        ) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Value "${value}" is not allowed for this attribute`
          );
        }

        const valueSource = isFromPossibleValues
          ? AttributeSource.ADMIN
          : AttributeSource.VENDOR;

        const attributeValue = await attributeService.createAttributeValues({
          value,
          attribute_id,
          source: valueSource,
          rank: 0,
        });

        // Link to product
        await linkService.create({
          [Modules.PRODUCT]: { product_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
        });

        // If vendor value, link to seller
        if (valueSource === AttributeSource.VENDOR) {
          await linkService.create({
            [SELLER_MODULE]: { seller_id: seller.id },
            [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
          });
        }
      }
    }
  }

  // Fetch updated product
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: product_id },
  });

  const transformedProduct = transformProductWithInformationalAttributes(
    product as any
  );

  res.json({ product: transformedProduct });
};

/**
 * @oas [delete] /vendor/products/{id}/attributes/{attribute_id}
 * operationId: "VendorDeleteProductAttribute"
 * summary: "Remove Attribute from Product"
 * description: "Removes an attribute and its values from a product. For admin attributes, only vendor-added values are removed. For vendor attributes, all values are removed."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: attribute_id
 *     required: true
 *     description: The ID of the Attribute.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product_id:
 *               type: string
 *             attribute_id:
 *               type: string
 *             deleted:
 *               type: boolean
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const attributeService =
    req.scope.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const { id: product_id, attribute_id } = req.params;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  // Fetch attribute
  const {
    data: [attribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["id", "source", "is_required"],
    filters: { id: attribute_id },
  });

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attribute_id}' not found`
    );
  }

  // Cannot delete required admin attributes
  if (attribute.source === AttributeSource.ADMIN && attribute.is_required) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cannot remove required attributes"
    );
  }

  // If vendor-owned attribute, verify seller ownership
  if (attribute.source === AttributeSource.VENDOR) {
    const {
      data: [ownershipLink],
    } = await query.graph({
      entity: sellerAttributeLink.entryPoint,
      fields: ["attribute_id"],
      filters: {
        seller_id: seller.id,
        attribute_id: attribute_id,
      },
    });

    if (!ownershipLink) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You do not own this attribute"
      );
    }
  }

  // Get attribute values for this product using efficient SQL query
  const attributeValues = await getProductAttributeValues(
    req.scope,
    product_id,
    attribute_id
  );

  // For admin attributes, only remove vendor-sourced values
  // For vendor attributes, remove all values (ownership already verified above)
  const valuesToRemove = attributeValues
    .filter((av) => {
      if (attribute.source === AttributeSource.VENDOR) {
        return true; // Remove all for vendor attributes
      }
      return av.source === AttributeSource.VENDOR;
    })
    .map((av) => av.attribute_value_id);

  // Remove links and delete values
  for (const valueId of valuesToRemove) {
    await linkService.dismiss({
      [Modules.PRODUCT]: { product_id },
      [ATTRIBUTE_MODULE]: { attribute_value_id: valueId },
    });
    await attributeService.deleteAttributeValues(valueId);
  }

  res.json({
    product_id,
    attribute_id,
    deleted: true,
    removed_values_count: valuesToRemove.length,
  });
};
