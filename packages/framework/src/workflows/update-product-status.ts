import { Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
} from "@medusajs/workflows-sdk";

export const updateProductStatusStep = createStep(
  "update-product-status",
  async (input: { id: string; status: ProductStatus }, { container }) => {
    const service = container.resolve(Modules.PRODUCT);

    const product = await service.updateProducts(input.id, {
      status: input.status,
    });

    return new StepResponse(product, product.id);
  }
);

export const updateProductStatusWorkflow = createWorkflow(
  "update-product-status",
  function (input: { id: string; status: ProductStatus }) {
    return new WorkflowResponse(updateProductStatusStep(input));
  }
);
