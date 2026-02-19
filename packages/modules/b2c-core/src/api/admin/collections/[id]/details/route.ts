import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import collectionCollectionDetails from "../../../../../links/collection-collection-details";
import { createCollectionDetailWorkflow, updateCollectionDetailWorkflow } from "../../../../../workflows/collection-detail";
import { defaultAdminCollectionDetailFields } from "../../query-config";
import { UpdateCollectionDetailType } from "../../validators";

/**
 * @oas [post] /admin/collections/{id}/details
 * operationId: "AdminUpdateCollectionDetails"
 * summary: "Update Collection Details"
 * description: "Updates the details (media, thumbnail, icon, banner, rank) of a product collection."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the product collection.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           media:
 *             type: object
 *             properties:
 *               create:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         alt_text:
 *                           type: string
 *                     - type: string
 *                 description: Media items to create.
 *               delete:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of media items to delete.
 *           thumbnail:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt_text:
 *                     type: string
 *               - type: string
 *             description: Thumbnail media (URL string or media object).
 *           icon:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt_text:
 *                     type: string
 *               - type: string
 *             description: Icon media (URL string or media object).
 *           banner:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt_text:
 *                     type: string
 *               - type: string
 *             description: Banner media (URL string or media object).
 *           rank:
 *             type: number
 *             description: The rank/order of the collection.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             collection_detail:
 *               $ref: "#/components/schemas/AdminCollectionDetail"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Collection not found"
 * tags:
 *   - Admin Collections
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
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

/**
 * @oas [get] /admin/collections/{id}/details
 * operationId: "AdminGetCollectionDetails"
 * summary: "Get Collection Details"
 * description: "Retrieves the details (media, thumbnail, icon, banner, rank) of a product collection."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the product collection.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             collection_detail:
 *               $ref: "#/components/schemas/AdminCollectionDetail"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Collection not found"
 * tags:
 *   - Admin Collections
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
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