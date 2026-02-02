import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AdminCreateFeaturedCollectionType } from "./validators";
import { createFeaturedCollectionWorkflow } from "../../../workflows/featured-collection/workflows/create-featured-collection";
import { fetchAllFeaturedCollectionsWithProductsDetails, fetchFeaturedCollectionWithProductsDetails } from "./utils";

export const POST = async (
    req: MedusaRequest<AdminCreateFeaturedCollectionType>,
    res: MedusaResponse
) => {
    const { result } = await createFeaturedCollectionWorkflow(req.scope).run({
        input: req.validatedBody,
    });

    const featuredCollectionWithProducts = await fetchFeaturedCollectionWithProductsDetails(req.scope, result.id);

    res.status(201).json({ featured_collection: featuredCollectionWithProducts });
}

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const featuredCollectionsWithProducts = await fetchAllFeaturedCollectionsWithProductsDetails(req.scope);

    res.status(200).json({ featured_collections: featuredCollectionsWithProducts });
}