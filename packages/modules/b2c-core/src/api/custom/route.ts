import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {

    const { result } = await createCollectionsWorkflow.run({
        container: req.scope,
        input: {
            collections: [
                {
                    title: 'Test Collection2',
                    handle: 'asdastest-collectionggg'
                }
            ],
            additional_data: {
                details: {
                    thumbnail: 'https://via.placeholder.com/150'
                }
            }
        }
    });

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const { data: [product_collections] } = await query.graph({
        entity: 'product_collection',
        fields: ['id', 'title', 'handle', 'collection_detail.*', 'collection_detail.media.id',
            'collection_detail.media.url',
            'collection_detail.media.alt_text',],
        filters: {
            id: result[0].id
        }
    });

    console.log(product_collections);

    res.json({
        result: product_collections
    });
}