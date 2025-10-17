import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { CreateProductAttributeValueDTO } from "@mercurjs/framework";

import productAttributeValue from "../../../links/product-attribute-value";

export const validateAttributeValueStepId = "validate-attribute-value";

export const validateAttributeValueStep = createStep(
  validateAttributeValueStepId,
  async (input: CreateProductAttributeValueDTO, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [attribute],
    } = await query.graph({
      entity: "attribute",
      fields: ["product_categories.id", "possible_values.value"],
      filters: {
        id: input.attribute_id,
      },
    });

    const allowedValues = attribute.possible_values?.map(
      (posVal) => posVal.value
    );

    if (allowedValues?.length && !allowedValues.includes(input.value)) {
      throw new MedusaError(
        MedusaErrorTypes.INVALID_DATA,
        `Attribute ${input.attribute_id} doesn't define ${input.value} as a possible_value`
      );
    }

    const attributeCategoryIds = attribute.product_categories.map(
      (cat) => cat.id
    );

    // If all attributes are global, we don't enforce for product.categories to include the attribute.product_categories, since there are none
    if (attributeCategoryIds.length) {
      const {
        data: [product],
      } = await query.graph({
        entity: "product",
        fields: ["categories.id"],
        filters: {
          id: input.product_id,
        },
      });

      const productCategoryIds = product.categories?.map((cat) => cat.id);
      if (
        !productCategoryIds?.some((prodCatId) =>
          attributeCategoryIds.includes(prodCatId)
        )
      ) {
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          `Product ${input.product_id} isn't linked to any category from the requested attributes.`
        );
      }
    }

    const { data: attributeValuesProduct } = await query.graph({
      entity: productAttributeValue.entryPoint,
      fields: ["attribute_value.value", "attribute_value.attribute_id"],
      filters: {
        product_id: input.product_id,
      },
    });

    const attributeValues = attributeValuesProduct.map(
      (element) => element.attribute_value
    );

    if (
      attributeValues.some(
        (value) =>
          value.attribute_id === input.attribute_id &&
          value.value === input.value
      )
    ) {
      throw new MedusaError(
        MedusaErrorTypes.DUPLICATE_ERROR,
        `Attribute value ${input.value} for attribute ${input.attribute_id} already exists for product ${input.product_id}`
      );
    }

    return new StepResponse();
  }
);
