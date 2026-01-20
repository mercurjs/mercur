import { MedusaError } from "@medusajs/framework/utils";

import { createAttributeValueWorkflow } from "../workflows";
import { AdminAttributeInput, AttributeSource } from "@mercurjs/framework";
import { ApplicableAttribute } from "./applicable-attribute";
import { MedusaContainer, ProductDTO } from "@medusajs/framework/types";

export const createAttributeValues = async (
  adminAttr: AdminAttributeInput,
  product: ProductDTO,
  container: MedusaContainer,
  attributeDef: ApplicableAttribute
) => {
  const allowedValues = new Set(
    attributeDef.possible_values?.map((pv) => pv.value) ?? []
  );

  const creationPromises = adminAttr.values.map((value) => {
    // Determine if value is from admin possible_values or vendor extension
    const isFromPossibleValues = allowedValues.size === 0 || allowedValues.has(value);
    
    if (allowedValues.size && !allowedValues.has(value)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Value "${value}" is not allowed for attribute "${attributeDef.name}". Allowed values: ${[
          ...allowedValues,
        ].join(", ")}`
      );
    }

    return createAttributeValueWorkflow(container).run({
      input: {
        attribute_id: adminAttr.attribute_id,
        value,
        product_id: product.id,
        source: isFromPossibleValues ? AttributeSource.ADMIN : AttributeSource.VENDOR,
      },
    });
  });

  await Promise.all(creationPromises);
};
