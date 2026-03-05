/**
 * @schema AdminCategoryDetail
 * title: "Category Detail"
 * description: "Category detail object with media information."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the category detail.
 *   thumbnail_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the thumbnail media.
 *   icon_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the icon media.
 *   banner_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the banner media.
 *   media:
 *     type: array
 *     description: Array of media items associated with the category.
 *     items:
 *       $ref: "#/components/schemas/AdminCategoryMedia"
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */

/**
 * @schema AdminCategoryMedia
 * title: "Category Media"
 * description: "Media item associated with a category."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the media.
 *   url:
 *     type: string
 *     description: The URL of the media.
 *   alt_text:
 *     type: string
 *     nullable: true
 *     description: Alternative text for the media.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */

