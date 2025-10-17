import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

import { fetchSellerByAuthActorId } from "../../../../../shared/infra/http/utils";
import { fetchProductDetails } from "../../../../../shared/infra/http/utils/products";
import { CreateProductVariantType } from "../../validators";
import { ProductUpdateRequestUpdatedEvent } from "@mercurjs/framework";

/**
 * @oas [post] /vendor/products/{id}/variants
 * operationId: "VendorCreateVariantForProductById"
 * summary: "Create variant for product"
 * description: "Creates variant for product."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
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
 *         $ref: "#/components/schemas/CreateProductVariant"
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
  req: AuthenticatedMedusaRequest<CreateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  await createProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      product_variants: [
        {
          ...req.validatedBody,
          product_id: req.params.id,
        },
      ],
      additional_data: {
        seller_id: seller.id,
      },
    },
  });

  const productDetails = await fetchProductDetails(req.params.id, req.scope);
  if (!["draft", "proposed"].includes(productDetails.status)) {
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
      filters: { id: req.params.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ product });
};
