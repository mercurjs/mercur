/**
 * *
 * @interface
 * 
 * The request details.
 * @property {string} id - The ID of the request.
 * @property {string} type - The type of the request
 * @property {Record<string, unknown>} data - The data of the request
 * @property {string} submitter_id - The associated submitter's ID.
 * @property {string} reviewer_id - The associated reviewer's ID.
 * @property {string} reviewer_note - The reviewer note of the request
 * @property {"pending" | "accepted" | "rejected"} status - The status of the request
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.

 */
export type RequestDTO = {
  /**
 * *
 * The ID of the request.

 */
id: string
  /**
 * *
 * The type of the request

 */
type: string
  /**
 * *
 * The data of the request

 */
data: Record<string, unknown>
  /**
 * *
 * The associated submitter's ID.

 */
submitter_id: string
  /**
 * *
 * The associated reviewer's ID.

 */
reviewer_id: string
  /**
 * *
 * The reviewer note of the request

 */
reviewer_note: string
  /**
 * *
 * The status of the request

 */
status: 'pending' | 'accepted' | 'rejected'
  /**
 * *
 * The associated date.

 */
created_at: Date
  /**
 * *
 * The associated date.

 */
updated_at: Date
}
