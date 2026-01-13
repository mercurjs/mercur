import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { ruleQueryConfigurations } from "@medusajs/medusa/api/admin/promotions/utils/rule-query-configuration";

import sellerCustomerGroup from "../../../../../../links/seller-customer-group";
import sellerProduct from "../../../../../../links/seller-product";
import "../../../../../../shared/infra/http/middlewares/types";
import { fetchSellerByAuthActorId } from "../../../../../../shared/infra/http/utils";
import { getRuleAttributesMap } from "../../../utils";

/**
 * @oas [get] /vendor/promotions/rule-attribute-options/{rule_type}
 * operationId: VendorGetPromotionsRuleAttributeOptionsRule
 * summary: List Rule Attribute Options of a Rule Type
 * x-sidebar-summary: List Potential Rule Attributes
 * description: Retrieve a list of potential rule attributes for the promotion and application method types specified in the query parameters.
 * x-authenticated: true
 * parameters:
 *   - name: rule_type
 *     in: path
 *     description: The rule type.
 *     required: true
 *     schema:
 *       type: string
 *       enum:
 *         - rules
 *         - target-rules
 *         - buy-rules
 *   - name: promotion_type
 *     in: query
 *     description: The promotion type to retrieve rules for.
 *     required: false
 *     schema:
 *       type: string
 *       title: promotion_type
 *       description: The promotion type to retrieve rules for.
 *       enum:
 *         - standard
 *         - buyget
 *   - name: application_method_type
 *     in: query
 *     description: The application method type to retrieve rules for.
 *     required: false
 *     schema:
 *       type: string
 *       title: application_method_type
 *       description: The application method type to retrieve rules for.
 *       enum:
 *         - fixed
 *         - percentage
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * tags:
 *   - Vendor Promotions
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           description: The list of attributes.
 *           properties:
 *             attributes:
 *               type: array
 *               description: The list of attributes.
 *               items:
 *                 $ref: "#/components/schemas/VendorRuleAttributeOption"
 *
 */

const vendorRuleQueryConfigurations = {
  ...ruleQueryConfigurations,
  product: {
    entryPoint: "product",
    valueAttr: "id",
    labelAttr: "title",
  },
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const ruleType = req.normalized_rule_type || req.params.rule_type;
  const { rule_attribute_id: ruleAttributeId } = req.params;
  const {
    promotion_type: promotionType,
    application_method_type: applicationMethodType,
  } = req.query;
  const queryConfig = vendorRuleQueryConfigurations[ruleAttributeId];
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const filterableFields = req.filterableFields;

  if (!queryConfig) {
    return res.status(400).json({
      type: "invalid_data",
      message: `Invalid rule attribute - ${ruleAttributeId}`,
    });
  }

  if (filterableFields.value) {
    filterableFields[queryConfig.valueAttr] = filterableFields.value;

    delete filterableFields.value;
  }

  const ruleAttributesMap = getRuleAttributesMap({
    promotionType: promotionType as string,
    applicationMethodType: applicationMethodType as string,
  });
  const validAttributes = ruleAttributesMap[ruleType] || [];
  const isValidAttribute = validAttributes.some(
    (attr) => attr.id === ruleAttributeId
  );

  if (!isValidAttribute) {
    return res.status(400).json({
      type: "invalid_data",
      message: `Invalid rule attribute - ${ruleAttributeId}. Valid attributes for ${ruleType}: ${validAttributes.map((a) => a.id).join(", ")}`,
    });
  }

  delete filterableFields.promotion_type;
  delete filterableFields.application_method_type;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  if (queryConfig.entryPoint === "product") {
    const { data: products } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ["product_id"],
      filters: {
        seller_id: seller.id,
      },
      withDeleted: true,
    });

    filterableFields["id"] = products.map((p) => p.product_id);
  }

  if (queryConfig.entryPoint === "customer_group") {
    const { data: groups } = await query.graph({
      entity: sellerCustomerGroup.entryPoint,
      fields: ["customer_group_id"],
      filters: {
        seller_id: seller.id,
      },
      withDeleted: true,
    });

    filterableFields["id"] = groups.map((p) => p.customer_group_id);
  }

  const { rows } = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: queryConfig.entryPoint,
      variables: {
        filters: filterableFields,
        ...req.queryConfig.pagination,
      },
      fields: [queryConfig.labelAttr, queryConfig.valueAttr],
    })
  );

  const values = rows.map((r) => ({
    label: r[queryConfig.labelAttr],
    value: r[queryConfig.valueAttr],
  }));

  res.json({
    values,
  });
};
