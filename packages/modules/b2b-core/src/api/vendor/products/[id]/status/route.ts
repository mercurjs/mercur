import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

import { ConfigurationRuleType } from "@mercurjs/framework";
import {
  CONFIGURATION_MODULE,
  ConfigurationModuleService,
} from "../../../../../modules/configuration";

import { VendorUpdateProductStatusType } from "../../validators";

/**
 * @oas [post] /vendor/products/{id}/status
 * operationId: "VendorUpdateProductStatusById"
 * summary: "Update a Product status"
 * description: "Updates an existing product status for the authenticated vendor."
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
 *         $ref: "#/components/schemas/VendorUpdateProductStatus"
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
  req: AuthenticatedMedusaRequest<VendorUpdateProductStatusType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const configuration =
    req.scope.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE);

  if (
    !["proposed", "draft"].includes(req.validatedBody.status) &&
    (await configuration.isRuleEnabled(
      ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
    ))
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This feature is disabled!"
    );
  }

  const { result } = await updateProductsWorkflow(req.scope).run({
    input: {
      update: req.validatedBody,
      selector: { id: req.params.id },
    },
  });

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: { id: result[0].id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ product });
};
