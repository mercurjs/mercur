/**
 * @schema AdminCollectionDetail
 * title: "Collection Detail"
 * description: "Collection detail object with media and rank information."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the collection detail.
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
 *   rank:
 *     type: number
 *     description: The rank/order of the collection.
 *   media:
 *     type: array
 *     description: Array of media items associated with the collection.
 *     items:
 *       $ref: "#/components/schemas/AdminCollectionMedia"
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
 * @schema AdminCollectionMedia
 * title: "Collection Media"
 * description: "Media item associated with a collection."
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

