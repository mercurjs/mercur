import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { getApplicableAttributes } from "../../../../../shared/infra/http/utils/products";

/**
 * @oas [get] /vendor/products/{id}/applicable-attributes
 * operationId: "VendorGetProductApplicableAttributes"
 * summary: "Get Product Applicable Attributes"
 * description: "Retrieves the applicable attributes for a specific product, including global attributes and category-specific attributes."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the product
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
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
 *             attributes:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorAttribute"
 *               description: Array of applicable attributes for the product
 *   "401":
 *     description: Unauthorized
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Unauthorized"
 *   "403":
 *     description: Forbidden
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Forbidden"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Product not found"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const attributes = await getApplicableAttributes(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  );

  res.json({
    attributes,
  });
};
