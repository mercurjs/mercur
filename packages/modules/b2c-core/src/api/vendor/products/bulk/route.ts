import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import {
  batchProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

import sellerProductLink from "../../../../links/seller-product";
import { fetchSellerByAuthActorId } from "../../../../shared/infra/http/utils";
import {
  VendorBulkDeleteProductsType,
  VendorBulkUpdateProductsType,
} from "../validators";

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

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  const { data: sellerProducts } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: ["product_id"],
    filters: {
      product_id: productIds,
      seller_id: seller.id,
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

  const updatePayload = productsToUpdate.map((product) => ({
    id: product.id,
    ...(product.title !== undefined && { title: product.title }),
    ...(product.status !== undefined && { status: product.status }),
    ...(product.discountable !== undefined && { discountable: product.discountable }),
  }));

  await batchProductsWorkflow(req.scope).run({
    input: {
      update: updatePayload,
    },
  });

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

/**
 * @oas [delete] /vendor/products/bulk
 * operationId: "VendorBulkDeleteProducts"
 * summary: "Bulk Delete Products"
 * description: "Deletes multiple products for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBulkDeleteProducts"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             ids:
 *               type: array
 *               items:
 *                 type: string
 *               description: The IDs of the deleted products
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
  req: AuthenticatedMedusaRequest<VendorBulkDeleteProductsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { ids: productIds } = req.validatedBody;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  const { data: sellerProducts } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: ["product_id"],
    filters: {
      product_id: productIds,
      seller_id: seller.id,
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

  await deleteProductsWorkflow(req.scope).run({
    input: {
      ids: productIds,
    },
  });

  res.json({
    ids: productIds,
    object: "product",
    deleted: true,
  });
};
