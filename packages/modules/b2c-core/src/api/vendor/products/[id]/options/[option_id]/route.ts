import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import {
  deleteProductOptionsWorkflow,
  updateProductOptionsWorkflow,
} from "@medusajs/medusa/core-flows";

import {
  AttributeUIComponent,
  ProductUpdateRequestUpdatedEvent,
} from "@mercurjs/framework";

import { fetchSellerByAuthActorId } from "../../../../../../shared/infra/http/utils";
import { fetchProductDetails } from "../../../../../../shared/infra/http/utils/products";
import { convertOptionToAttributeWorkflow } from "../../../../../../workflows/attribute/workflows/convert-option-to-attribute";
import { findOrCreateVendorAttribute } from "../../../../../../workflows/attribute/utils/find-or-create-vendor-attribute";
import { UpdateProductOptionType } from "../../../validators";

/**
 * @oas [delete] /vendor/products/{id}/options/{option_id}
 * operationId: "VendorDeleteProductOptionById"
 * summary: "Delete a Product option"
 * description: "Deletes a product option by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: option_id
 *     required: true
 *     description: The ID of the Option.
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
 *             id:
 *               type: string
 *               description: The ID of the deleted Product option
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
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
  const productId = req.params.id;
  const optionId = req.params.option_id;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [option],
  } = await query.graph({
    entity: "product_option",
    fields: ["product_id"],
    filters: {
      id: optionId,
    },
  });

  if (productId !== option.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid product option id!"
    );
  }

  await deleteProductOptionsWorkflow.run({
    container: req.scope,
    input: { ids: [optionId] },
  });

  res.json({
    id: optionId,
    object: "option",
    deleted: true,
  });
};

/**
 * @oas [post] /vendor/products/{id}/options/{option_id}
 * operationId: "VendorUpdateProductOptionById"
 * summary: "Update a Product option"
 * description: "Updates an existing product option for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: option_id
 *     required: true
 *     description: The ID of the Option.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateProductOption"
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
  req: AuthenticatedMedusaRequest<UpdateProductOptionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productId = req.params.id;
  const optionId = req.params.option_id;
  const { convert_to_attribute, ...updateData } = req.validatedBody;

  // Handle conversion to attribute
  if (convert_to_attribute) {
    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    );

    // Fetch option with values
    const {
      data: [option],
    } = await query.graph({
      entity: "product_option",
      fields: ["id", "title", "product_id", "values.id", "values.value"],
      filters: { id: optionId },
    });

    if (!option) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product option with id '${optionId}' not found`
      );
    }

    if (option.product_id !== productId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option does not belong to this product"
      );
    }

    // Extract values from option
    const optionValues =
      option.values?.map((v: { value: string }) => v.value) ?? [];

    // Find or create vendor attribute with same name
    const vendorAttribute = await findOrCreateVendorAttribute(req.scope, {
      sellerId: seller.id,
      name: option.title,
      ui_component: AttributeUIComponent.SELECT,
    });

    await convertOptionToAttributeWorkflow(req.scope).run({
      input: {
        product_id: productId,
        option_id: optionId,
        seller_id: seller.id,
        attribute_id: vendorAttribute.id,
        values: optionValues,
      },
    });
  } else {
    // Normal update
    await updateProductOptionsWorkflow.run({
      container: req.scope,
      input: {
        selector: { id: optionId, product_id: productId },
        update: updateData,
      },
    });
  }

  const productDetails = await fetchProductDetails(req.params.id, req.scope);
  if (!["draft", "proposed"].includes(productDetails.status)) {
    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    );
    const eventBus = req.scope.resolve(Modules.EVENT_BUS);
    await eventBus.emit({
      name: ProductUpdateRequestUpdatedEvent.TO_CREATE,
      data: {
        data: {
          data: { product_id: req.params.id, title: productDetails.title },
          submitter_id: req.auth_context.actor_id,
          type: "product_update",
        },
        seller_id: seller.id,
      },
    });
  }

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: { id: productId },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ product });
};
