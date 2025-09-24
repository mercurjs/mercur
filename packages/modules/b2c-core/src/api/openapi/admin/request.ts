/**
 * @schema AdminRequest
 * title: "Request"
 * description: "A request object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the request.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   type:
 *     type: string
 *     description: The type of the request object.
 *   data:
 *     type: object
 *     description: The request payload.
 *   submitter_id:
 *     type: string
 *     description: A unique id of the submitter
 *   reviewer_id:
 *     type: string
 *     description: A unique id of the reviewer
 *     nullable: true
 *   reviewer_note:
 *     type: string
 *     description: A note provided by the reviewer
 *     nullable: true
 *   status:
 *     type: string
 *     description: The status of the request
 *   seller:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 */
