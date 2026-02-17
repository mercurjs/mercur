import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createProductOptionsWorkflow } from "@medusajs/medusa/core-flows";

import {
  AttributeSource,
  AttributeUIComponent,
} from "@mercurjs/framework";

import { fetchSellerByAuthActorId } from "../../../../../shared/infra/http/utils";
import { getApplicableAttributes } from "../../../../../shared/infra/http/utils/products";
import { createAndLinkAttributeValuesWorkflow } from "../../../../../workflows/attribute/workflows/create-and-link-attribute-values";
import { findOrCreateVendorAttribute } from "../../../../../workflows/attribute/utils/find-or-create-vendor-attribute";
import { VendorAddProductAttributeType } from "../../validators";
import { transformProductWithInformationalAttributes } from "../../utils/transform-product-attributes";
import { getProductAttributeValues } from "./utils";

/**
 * @oas [post] /vendor/products/{id}/attributes
 * operationId: "VendorAddProductAttribute"
 * summary: "Add Attribute to Product"
 * description: "Adds an attribute to a product. Can reference an admin attribute by ID or create/find a vendor attribute by name."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorAddProductAttribute"
 * responses:
 *   "201":
 *     description: Created
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
  req: AuthenticatedMedusaRequest<VendorAddProductAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id: product_id } = req.params;
  const { attribute_id, name, values, use_for_variations, ui_component } =
    req.validatedBody;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  // Validate: must have either attribute_id OR name
  if (!attribute_id && !name) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Either attribute_id or name must be provided"
    );
  }

  if (use_for_variations) {
    // Create ProductOption
    const optionTitle = name ?? (await getAttributeName(query, attribute_id!));

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
    });
  } else {
    // Create informational attribute
    let resolvedAttributeId: string;

    if (attribute_id) {
      // Using admin attribute
      const { data: [attribute] } = await query.graph({
        entity: "attribute",
        fields: ["id", "source", "possible_values.value"],
        filters: { id: attribute_id },
      });

      if (!attribute) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Attribute with id '${attribute_id}' not found`
        );
      }

      const applicableAttributes = await getApplicableAttributes(
        req.scope,
        product_id,
        ["id"]
      );
      const applicableAttributeIds = new Set(
        applicableAttributes.map((applicableAttribute) => applicableAttribute.id)
      );

      if (!applicableAttributeIds.has(attribute_id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Attribute is not applicable to this product's category"
        );
      }

      resolvedAttributeId = attribute.id;

      // Validate: prevent assigning the same attribute multiple times to a product
      const existingValues = await getProductAttributeValues(
        req.scope,
        product_id,
        resolvedAttributeId
      );
      if (existingValues.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Attribute already assigned to this product. Use UPDATE endpoint to modify values."
        );
      }

      // Validate values against possible_values if defined
      const allowedValues = new Set(
        attribute.possible_values?.map((pv: { value: string }) => pv.value) ?? []
      );

      const valuesWithSource = values.map((value) => {
        // Determine source based on whether value is in possible_values
        const isFromPossibleValues =
          allowedValues.size === 0 || allowedValues.has(value);

        const source = isFromPossibleValues
          ? AttributeSource.ADMIN
          : AttributeSource.VENDOR;

        return { value, source };
      });

      await createAndLinkAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          attribute_id: resolvedAttributeId,
          seller_id: seller.id,
          values: valuesWithSource,
        },
      });
    } else {
      // Creating/finding vendor attribute
      const vendorAttribute = await findOrCreateVendorAttribute(req.scope, {
        sellerId: seller.id,
        name: name!,
        ui_component:
          (ui_component as AttributeUIComponent) ?? AttributeUIComponent.TEXTAREA,
      });

      resolvedAttributeId = vendorAttribute.id;

      // Validate: prevent assigning the same attribute multiple times to a product
      const existingValues = await getProductAttributeValues(
        req.scope,
        product_id,
        resolvedAttributeId
      );
      if (existingValues.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Attribute already assigned to this product. Use UPDATE endpoint to modify values."
        );
      }

      await createAndLinkAttributeValuesWorkflow(req.scope).run({
        input: {
          product_id,
          attribute_id: resolvedAttributeId,
          seller_id: seller.id,
          values: values.map((value) => ({
            value,
            source: AttributeSource.VENDOR,
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

  res.status(201).json({ product: transformedProduct });
};

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
  });

  if (!attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id '${attributeId}' not found`
    );
  }

  return attribute.name;
}
