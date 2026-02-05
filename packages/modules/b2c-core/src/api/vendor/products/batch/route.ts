import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import {
  batchProductsWorkflow,
} from "@medusajs/medusa/core-flows";

import sellerProductLink from "../../../../links/seller-product";
import { fetchSellerByAuthActorId } from "../../../../shared/infra/http/utils";
import {
  VendorBatchUpdateProductsType,
} from "../validators";
import { CONFIGURATION_MODULE, ConfigurationModuleService } from "../../../../modules/configuration";
import { ConfigurationRuleType } from "@mercurjs/framework";

/**
 * @oas [post] /vendor/products/batch
 * operationId: "VendorBatchUpdateProducts"
 * summary: "Batch Update Products"
 * description: "Updates multiple products for the authenticated vendor. Allows updating title, status, and discountable fields."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBatchUpdateProducts"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             updated:
 *               type: array
 *               description: The updated products.
 *             deleted:
 *               type: array
 *               description: The deleted products.
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchUpdateProductsType>,
  res: MedusaResponse
) => {
  const configuration = req.scope.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const productIdsToChange = [...req.validatedBody.update.map((p) => p.id), ...req.validatedBody.delete];

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  const [configurationRule, { data: sellerProducts }] = await Promise.all([
    configuration.isRuleEnabled(ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL),
    query.graph({
      entity: sellerProductLink.entryPoint,
      fields: ["product_id"],
      filters: {
        product_id: productIdsToChange,
        seller_id: seller.id,
      },
    }),
  ]);


  const ownedProductIds = new Set(sellerProducts.map((sp) => sp.product_id));
  const unauthorizedProducts = productIdsToChange.filter((id) => !ownedProductIds.has(id));

  if (unauthorizedProducts.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Products not found or not owned by this seller: ${unauthorizedProducts.join(", ")}`
    );
  }

  const isStatusChangeForbidden = req.validatedBody.update.some((p) => p.status && !["proposed", "draft"].includes(p.status) &&
    configurationRule);

  if (isStatusChangeForbidden) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "At least one product status change is forbidden."
    );
  }

  const batchResult = await batchProductsWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.status(200).json({
    updated: batchResult.result.updated,
    deleted: batchResult.result.deleted,
  });
};

