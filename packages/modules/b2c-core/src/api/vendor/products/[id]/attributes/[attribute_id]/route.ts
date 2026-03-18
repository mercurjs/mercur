import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";

import {
  AttributeSource,
  AttributeUIComponent,
} from "@mercurjs/framework";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../../../../modules/attribute";
import { fetchSellerByAuthActorId } from "../../../../../../shared/infra/http/utils";
import sellerAttributeLink from "../../../../../../links/seller-attribute";
import { VendorUpdateProductAttributeType } from "../../../validators";
import { transformProductWithInformationalAttributes } from "../../../utils/transform-product-attributes";
import { convertAttributeToOptionWorkflow } from "../../../../../../workflows/attribute/workflows/convert-attribute-to-option";
import { deleteAttributeValueWorkflow } from "../../../../../../workflows/attribute/workflows/delete-attribute-value";
import { syncProductAttributeValuesWorkflow } from "../../../../../../workflows/attribute/workflows/sync-product-attribute-values";
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

    await convertAttributeToOptionWorkflow(req.scope).run({
      input: {
        product_id,
        seller_id: seller.id,
        option_title: attribute.name,
        option_values: values ?? currentValues,
        attribute_value_ids: valueIds,
      },
    });
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

      await syncProductAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          seller_id: seller.id,
          attribute_id,
          attribute_source: attribute.source,
          possible_values:
            attribute.possible_values?.map((pv: { value: string }) => pv.value) ??
            [],
          new_values: values,
          existing_values: attributeValues.map((value) => ({
            attribute_value_id: value.attribute_value_id,
            value: value.value,
          })),
        },
      });
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

  // Required admin attributes are blocked above.
  // For non-required admin attributes and vendor attributes, remove all values:
  // DELETE means detaching this attribute from the product.
  const valuesToRemove = attributeValues.map((av) => av.attribute_value_id);

  if (valuesToRemove.length > 0) {
    await deleteAttributeValueWorkflow(req.scope).run({
      input: valuesToRemove,
    });
  }

  res.json({
    product_id,
    attribute_id,
    deleted: true,
    removed_values_count: valuesToRemove.length,
  });
};
