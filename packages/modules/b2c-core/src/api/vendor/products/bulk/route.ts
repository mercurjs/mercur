import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { batchProductsWorkflow } from "@medusajs/medusa/core-flows";

import sellerProductLink from "../../../../links/seller-product";
import { VendorBulkUpdateProductsType } from "../validators";

/**
 * @oas [post] /vendor/products/bulk
 * operationId: "VendorBulkUpdateProducts"
 * summary: "Bulk Update Products"
 * description: "Updates multiple products for the authenticated vendor. Allows updating title, status, and discountable fields."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBulkUpdateProducts"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProduct"
 *             count:
 *               type: integer
 *               description: The number of updated products
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBulkUpdateProductsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { products: productsToUpdate } = req.validatedBody;
  const productIds = productsToUpdate.map((p) => p.id);

  // Get the authenticated member's seller
  const {
    data: [member],
  } = await query.graph(
    {
      entity: "member",
      fields: ["seller.id"],
      filters: {
        id: req.auth_context.actor_id,
      },
    },
    { throwIfKeyNotFound: true }
  );

  const sellerId = member.seller.id;

  // Verify ownership of all products in a single query
  const { data: sellerProducts } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: ["product_id"],
    filters: {
      product_id: productIds,
      seller_id: sellerId,
    },
  });

  const ownedProductIds = new Set(sellerProducts.map((sp) => sp.product_id));
  const unauthorizedProducts = productIds.filter((id) => !ownedProductIds.has(id));

  if (unauthorizedProducts.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Products not found or not owned by this seller: ${unauthorizedProducts.join(", ")}`
    );
  }

  // Prepare the update payload for batchProductsWorkflow
  const updatePayload = productsToUpdate.map((product) => ({
    id: product.id,
    ...(product.title !== undefined && { title: product.title }),
    ...(product.status !== undefined && { status: product.status }),
    ...(product.discountable !== undefined && { discountable: product.discountable }),
  }));

  // Execute the batch update workflow
  const { result } = await batchProductsWorkflow(req.scope).run({
    input: {
      update: updatePayload,
    },
  });

  // Fetch the updated products with full details
  const { data: updatedProducts } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: {
      id: productIds,
    },
  });

  res.json({
    products: updatedProducts,
    count: updatedProducts.length,
  });
};
