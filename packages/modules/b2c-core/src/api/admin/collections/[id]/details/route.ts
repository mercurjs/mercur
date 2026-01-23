import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import collectionCollectionDetails from "../../../../../links/collection-collection-details";
import { createCollectionDetailWorkflow, updateCollectionDetailWorkflow } from "../../../../../workflows/collection-detail";
import { defaultAdminCollectionDetailFields } from "../../query-config";
import { UpdateCollectionDetailType } from "../../validators";


export const POST = async (req: MedusaRequest<UpdateCollectionDetailType>, res: MedusaResponse) => {
    const { id } = req.params;

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: [collection] } = await query.graph({
        entity: collectionCollectionDetails.entryPoint,
        filters: {
            product_collection_id: id
        },
        fields: [
            'product_collection_id',
            'collection_detail_id'
        ],
    });

    if (!collection) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Collection not found');
    }

    if (!collection.collection_detail_id) {
        const { result: createdCollectionDetail } = await createCollectionDetailWorkflow.run({
            container: req.scope,
            input: {
                product_collection_id: id
            }
        });

        collection.collection_detail_id = createdCollectionDetail.id;
    }

    await updateCollectionDetailWorkflow.run({
        container: req.scope,
        input: {
            collection_detail_id: collection.collection_detail_id,
            ...req.validatedBody
        }
    });

    const { data: [collectionDetail] } = await query.graph({
        entity: 'collection_detail',
        filters: {
            id: collection.collection_detail_id
        },
        fields: defaultAdminCollectionDetailFields
    });

    res.json({
        collection_detail: collectionDetail,
    });
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: [collection] } = await query.graph({
        entity: collectionCollectionDetails.entryPoint,
        filters: {
            product_collection_id: id
        },
        fields: [
            'collection_detail_id',
            ...defaultAdminCollectionDetailFields.map(field => `collection_detail.${field}`),
        ],
    });

    if (!collection) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Collection not found');
    }

    res.json({
        collection_detail: collection.collection_detail,
    });
};