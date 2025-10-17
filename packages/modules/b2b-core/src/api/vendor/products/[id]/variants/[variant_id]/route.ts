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
  deleteProductVariantsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";

import { fetchSellerByAuthActorId } from "../../../../../../shared/infra/http/utils";
import { fetchProductDetails } from "../../../../../../shared/infra/http/utils/products";
import { UpdateProductVariantType } from "../../../validators";
import { ProductUpdateRequestUpdatedEvent } from "@mercurjs/framework";

/**
 * @oas [delete] /vendor/products/{id}/variants/{variant_id}
 * operationId: "VendorDeleteProductVariantById"
 * summary: "Delete a Product variant"
 * description: "Deletes a product variant by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: variant_id
 *     required: true
 *     description: The ID of the Variant.
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
 *               description: The ID of the deleted Product variant
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
  const variantId = req.params.variant_id;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [variant],
  } = await query.graph({
    entity: "product_variant",
    fields: ["product_id"],
    filters: {
      id: variantId,
    },
  });

  if (productId !== variant.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid product variant id!"
    );
  }

  await deleteProductVariantsWorkflow(req.scope).run({
    input: { ids: [variantId] },
  });

  res.json({
    id: variantId,
    object: "variant",
    deleted: true,
  });
};

/**
 * @oas [post] /vendor/products/{id}/variants/{variant_id}
 * operationId: "VendorUpdateProductVariantById"
 * summary: "Update a Product variant"
 * description: "Updates an existing product variant for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: variant_id
 *     required: true
 *     description: The ID of the Variant.
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
 *         $ref: "#/components/schemas/UpdateProductVariant"
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
  req: AuthenticatedMedusaRequest<UpdateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productId = req.params.id;
  const variantId = req.params.variant_id;
  const productDetails = await fetchProductDetails(productId, req.scope);

  await updateProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      update: req.validatedBody,
      selector: { id: variantId, product_id: productId },
    },
  });

  if (!["draft", "proposed"].includes(productDetails.status)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prices, ...rest } = req.validatedBody;
    // Check if there are other changes than prices
    if (rest) {
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
