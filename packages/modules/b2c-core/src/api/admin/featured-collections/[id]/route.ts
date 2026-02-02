import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { fetchFeaturedCollectionWithProductsDetails } from "../utils";
import { deleteFeaturedCollectionWorkflow } from "../../../../workflows/featured-collection/workflows/delete-featured-collection";
import { AdminUpdateFeaturedCollection } from "../validators";
import { updateFeaturedCollectionWorkflow } from "../../../../workflows/featured-collection/workflows/update-featured-collection";

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const featuredCollection = await fetchFeaturedCollectionWithProductsDetails(req.scope, req.params.id);

    res.status(200).json({ featured_collection: featuredCollection });
}

export const DELETE = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    await deleteFeaturedCollectionWorkflow(req.scope).run({
        input: req.params.id,
    });

    res.status(200).send();
}

export const POST = async (
    req: MedusaRequest<AdminUpdateFeaturedCollection>,
    res: MedusaResponse
) => {
    await updateFeaturedCollectionWorkflow(req.scope).run({
        input: {
            ...req.validatedBody,
            id: req.params.id,
        },
    });

    const featuredCollection = await fetchFeaturedCollectionWithProductsDetails(req.scope, req.params.id);

    res.status(200).json({ featured_collection: featuredCollection });
}