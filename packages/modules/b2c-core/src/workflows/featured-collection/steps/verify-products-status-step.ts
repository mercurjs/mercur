import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { FeaturedCollectionProductDTO } from "@mercurjs/framework";
import { ContainerRegistrationKeys, MedusaError, MedusaErrorTypes } from "@medusajs/framework/utils";

export const verifyProductsStatusStepId =
    "verify-products-status-step";

export type VerifyProductsStatusStepInput = FeaturedCollectionProductDTO[];
export const verifyProductsStatusStep = createStep(verifyProductsStatusStepId, async (input: VerifyProductsStatusStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "status", "deleted_at"],
        filters: {
            id: input.map((product) => product.product_id),
            status: "published",
            deleted_at: null,
        },
    });

    const productsVerified = products.length === input.length;
    if (!productsVerified) {
        throw new MedusaError(MedusaErrorTypes.INVALID_DATA, "Some products are not published or deleted");
    }

    return new StepResponse(productsVerified);
});