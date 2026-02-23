import { MedusaContainer } from '@medusajs/framework';
import { ProductDTO } from '@medusajs/framework/types';
import {
  arrayDifference,
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils';

import { ProductAttributeValueDTO } from '@mercurjs/framework';

import productAttributeValue from '../../../links/product-attribute-value';
import {
  createAttributeValueWorkflow,
  deleteAttributeValueWorkflow
} from '../../../workflows/attribute/workflows';
import { getApplicableAttributes } from '../../../shared/infra/http/utils/products';

export const productsUpdatedHookHandler = async ({
  products,
  additional_data,
  container
}: {
  products: ProductDTO[];
  additional_data: Record<string, unknown> | undefined;
  container: MedusaContainer;
}) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const attributeValues = (additional_data?.values ??
    []) as ProductAttributeValueDTO[];
  const productIds = products.map((prod) => prod.id);

  if (!attributeValues.length) {
    return [];
  }

  const attributeErrors: string[] = [];
  for (const product of products) {
    const requiredAttributes = (
      await getApplicableAttributes(container, product.id, [
        'id',
        'name',
        'is_required'
      ])
    ).filter((attr) => attr.is_required);

    const missingAttributesIds = arrayDifference(
      requiredAttributes.map((attr) => attr.id),
      attributeValues
        .filter((attr) => !!attr.value)
        .map((attr) => attr.attribute_id)
    );

    const missingAttributes = requiredAttributes
      .filter((attr) => missingAttributesIds.includes(attr.id))
      .map((attr) => attr.name);

    if (missingAttributesIds.length) {
      attributeErrors.push(
        `Missing required attributes for product ${product.title}: ${missingAttributes.join(', ')}`
      );
    }
  }

  if (attributeErrors.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      attributeErrors.join(';\n')
    );
  }

  const updatedValueIds = (
    await Promise.all(
      productIds.map(async (prodId) => {
        const { data: productValues } = await query.graph({
          entity: productAttributeValue.entryPoint,
          fields: [
            'attribute_value.id',
            'attribute_value.value',
            'attribute_value.attribute_id'
          ],
          filters: {
            product_id: prodId
          }
        });

        return Promise.all(
          attributeValues.map(async (attrVal) => {
            const unchangedProductValue = productValues
              .filter((prodVal) => prodVal.attribute_value)
              .find(
                (prodVal) =>
                  prodVal.attribute_value.value === attrVal.value &&
                  prodVal.attribute_value.attribute_id === attrVal.attribute_id
              );
            if (unchangedProductValue) {
              return unchangedProductValue.attribute_value.id as string;
            }

            const { result } = await createAttributeValueWorkflow(
              container
            ).run({
              input: {
                attribute_id: attrVal.attribute_id,
                value: attrVal.value,
                product_id: prodId
              }
            });
            return result.id;
          })
        );
      })
    )
  ).flat();

  const { data: attributeValuesToDelete } = await query.graph({
    entity: productAttributeValue.entryPoint,
    fields: ['attribute_value_id'],
    filters: {
      attribute_value_id: {
        $nin: updatedValueIds
      },
      product_id: productIds
    }
  });

  if (!attributeValuesToDelete.length) {
    return;
  }

  await deleteAttributeValueWorkflow(container).run({
    input: attributeValuesToDelete.map((val) => val.attribute_value_id)
  });
};
