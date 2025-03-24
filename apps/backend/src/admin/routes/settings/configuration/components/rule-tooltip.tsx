import { Tooltip } from "@medusajs/ui";
import { InformationCircleSolid } from "@medusajs/icons";

export type RuleType =
  | "global_product_catalog"
  | "require_product_approval"
  | "product_request_enabled"
  | "product_import_enabled";

const getTooltipContent = (type: RuleType) => {
  switch (type) {
    case "global_product_catalog":
      return "Indicates whether sellers can only add inventory to admin-managed global products";
    case "product_request_enabled":
      return "Allow sellers to propose new products for inclusion in the catalog";
    case "require_product_approval":
      return "Indicates whether seller-added products require admin approval before becoming ready to list";
    case "product_import_enabled":
      return "Allow sellers to import products via csv file"
  }
};

export const ConfigurationRuleTooltip = ({ type }: { type: RuleType }) => {
  return (
    <Tooltip content={getTooltipContent(type)}>
      <InformationCircleSolid />
    </Tooltip>
  );
};
