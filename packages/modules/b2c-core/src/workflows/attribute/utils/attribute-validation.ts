import { MedusaError } from "@medusajs/framework/utils";

import { ApplicableAttribute } from "./applicable-attribute";

export const ensureApplicableAttribute = (
  attributeId: string,
  attributesById: Map<string, ApplicableAttribute>,
  productTitle: string
): ApplicableAttribute => {
  const attributeDef = attributesById.get(attributeId);
  if (!attributeDef) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Attribute ${attributeId} is not applicable to product "${productTitle}"`
    );
  }

  return attributeDef;
};
