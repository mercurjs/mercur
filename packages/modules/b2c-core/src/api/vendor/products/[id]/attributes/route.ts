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
} from "../../../../../modules/attribute";
import { SELLER_MODULE } from "../../../../../modules/seller";
import { fetchSellerByAuthActorId } from "../../../../../shared/infra/http/utils";
import { findOrCreateVendorAttribute } from "../../../../../workflows/attribute/utils/find-or-create-vendor-attribute";
import { VendorAddProductAttributeType } from "../../validators";
import { vendorProductFields } from "../../query-config";
import { transformProductWithInformationalAttributes } from "../../utils/transform-product-attributes";

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
  const attributeService =
    req.scope.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);
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
    let valueSource: AttributeSource;

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

      resolvedAttributeId = attribute.id;

      // Validate values against possible_values if defined
      const allowedValues = new Set(
        attribute.possible_values?.map((pv: { value: string }) => pv.value) ?? []
      );

      for (const value of values) {
        // Determine source based on whether value is in possible_values
        const isFromPossibleValues =
          allowedValues.size === 0 || allowedValues.has(value);

        if (allowedValues.size > 0 && !allowedValues.has(value)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Value "${value}" is not allowed for attribute. Allowed values: ${[
              ...allowedValues,
            ].join(", ")}`
          );
        }

        valueSource = isFromPossibleValues
          ? AttributeSource.ADMIN
          : AttributeSource.VENDOR;

        // Create AttributeValue
        const attributeValue = await attributeService.createAttributeValues({
          value,
          attribute_id: resolvedAttributeId,
          source: valueSource,
          rank: 0,
        });

        // Link to product
        await linkService.create({
          [Modules.PRODUCT]: { product_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
        });

        // If vendor value, link to seller for ownership
        if (valueSource === AttributeSource.VENDOR) {
          await linkService.create({
            [SELLER_MODULE]: { seller_id: seller.id },
            [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
          });
        }
      }
    } else {
      // Creating/finding vendor attribute
      const vendorAttribute = await findOrCreateVendorAttribute(req.scope, {
        sellerId: seller.id,
        name: name!,
        ui_component:
          (ui_component as AttributeUIComponent) ?? AttributeUIComponent.TEXTAREA,
      });

      resolvedAttributeId = vendorAttribute.id;

      // Create values (all vendor source)
      for (const value of values) {
        const attributeValue = await attributeService.createAttributeValues({
          value,
          attribute_id: resolvedAttributeId,
          source: AttributeSource.VENDOR,
          rank: 0,
        });

        // Link to product
        await linkService.create({
          [Modules.PRODUCT]: { product_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
        });

        // Link to seller
        await linkService.create({
          [SELLER_MODULE]: { seller_id: seller.id },
          [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
        });
      }
    }
  }

  // Fetch updated product
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: vendorProductFields,
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
