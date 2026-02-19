import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import categoryCategoryDetails from "../../../../../links/category-category-details";
import { createCategoryDetailWorkflow, updateCategoryDetailWorkflow } from "../../../../../workflows/category-detail";
import { defaultAdminCategoryDetailFields } from "../../query-config";
import { UpdateCategoryDetailType } from "../../validators";

/**
 * @oas [post] /admin/product-categories/{id}/details
 * operationId: "AdminUpdateCategoryDetails"
 * summary: "Update Category Details"
 * description: "Updates the details (media, thumbnail, icon, banner) of a product category."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the product category.
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             category_detail:
 *               $ref: "#/components/schemas/AdminCategoryDetail"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Category not found"
 * tags:
 *   - Admin Product Categories
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (req: MedusaRequest<UpdateCategoryDetailType>, res: MedusaResponse) => {
    const { id } = req.params;

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: [category] } = await query.graph({
        entity: categoryCategoryDetails.entryPoint,
        filters: {
            product_category_id: id
        },
        fields: [
            'product_category_id',
            'category_detail_id'
        ],
    });

    if (!category) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Category not found');
    }

    if (!category.category_detail_id) {
        const { result: createdCategoryDetail } = await createCategoryDetailWorkflow.run({
            container: req.scope,
            input: {
                product_category_id: id
            }
        });

        category.category_detail_id = createdCategoryDetail.id;
    }

    await updateCategoryDetailWorkflow.run({
        container: req.scope,
        input: {
            category_detail_id: category.category_detail_id,
            ...req.validatedBody
        }
    });

    const { data: [categoryDetail] } = await query.graph({
        entity: 'category_detail',
        filters: {
            id: category.category_detail_id
        },
        fields: defaultAdminCategoryDetailFields
    });

    res.json({
        category_detail: categoryDetail,
    });
}

/**
 * @oas [get] /admin/product-categories/{id}/details
 * operationId: "AdminGetCategoryDetails"
 * summary: "Get Category Details"
 * description: "Retrieves the details (media, thumbnail, icon, banner) of a product category."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the product category.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             category_detail:
 *               $ref: "#/components/schemas/AdminCategoryDetail"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Category not found"
 * tags:
 *   - Admin Product Categories
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: [category] } = await query.graph({
        entity: categoryCategoryDetails.entryPoint,
        filters: {
            product_category_id: id
        },
        fields: [
            'category_detail_id',
            ...defaultAdminCategoryDetailFields.map(field => `category_detail.${field}`),
        ],
    });

    if (!category) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Category not found');
    }

    res.json({
        category_detail: category.category_detail,
    });
};

