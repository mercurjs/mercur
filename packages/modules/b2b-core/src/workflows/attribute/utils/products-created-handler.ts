import { MedusaContainer, ProductDTO } from "@medusajs/framework/types";
import { MedusaError, arrayDifference } from "@medusajs/framework/utils";

import { ProductAttributeValueDTO } from "@mercurjs/framework";

import { getApplicableAttributes } from "../../../shared/infra/http/utils/products";
import { createAttributeValueWorkflow } from "../../../workflows/attribute/workflows";

export const productsCreatedHookHandler = async ({
  products,
  additional_data,
  container,
}: {
  products: ProductDTO[];
  additional_data: Record<string, unknown> | undefined;
  container: MedusaContainer;
}) => {
  const attributeValues = (additional_data?.values ??
    []) as ProductAttributeValueDTO[];

  if (!attributeValues.length) {
    return [];
  }

  for (const product of products) {
    const requiredAttributes = (
      await getApplicableAttributes(container, product.id, [
        "id",
        "name",
        "is_required",
      ])
    ).filter((attr) => attr.is_required);

    const missingAttributes = arrayDifference(
      requiredAttributes.map((attr) => attr.id),
      attributeValues.map((attr) => attr.attribute_id)
    );

    if (missingAttributes.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing required attributes for product ${product.title}: ${missingAttributes.join(", ")}`
      );
    }

    for (const attrVal of attributeValues) {
      await createAttributeValueWorkflow(container).run({
        input: {
          attribute_id: attrVal.attribute_id,
          value: attrVal.value,
          product_id: product.id,
        },
      });
    }
  }
};
