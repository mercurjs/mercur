import { AdditionalData, UpdateProductDTO } from '@medusajs/framework/types';
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when
} from '@medusajs/workflows-sdk';
import { updateProductsWorkflow } from '@medusajs/medusa/core-flows';

import {
  restoreVariantImageAssociationsStep,
  saveVariantImageAssociationsStep
} from '../steps';

export type UpdateProductWithVariantImagesInput = {
  selector: { id: string };
  update: UpdateProductDTO & { id?: never };
  additional_data?: AdditionalData;
};

export const updateProductWithVariantImagesWorkflow = createWorkflow(
  'update-product-with-variant-images',
  function (input: UpdateProductWithVariantImagesInput) {
    const savedAssociations = when({ input }, ({ input }) => {
      return !!input.update.images;
    }).then(() => {
      return saveVariantImageAssociationsStep({
        productId: input.selector.id
      });
    });

    const updateResult = updateProductsWorkflow.runAsStep({
      input
    });

    when({ savedAssociations }, ({ savedAssociations }) => {
      return !!savedAssociations?.associations;
    }).then(() => {
      const productId = transform({ updateResult }, ({ updateResult }) => {
        return updateResult[0].id;
      });

      const associations = transform(
        { savedAssociations },
        ({ savedAssociations }) => {
          return savedAssociations!.associations;
        }
      );

      restoreVariantImageAssociationsStep({
        productId,
        associations
      });
    });

    return new WorkflowResponse(updateResult);
  }
);
