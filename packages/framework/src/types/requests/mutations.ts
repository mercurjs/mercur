export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'draft'

/**
 * *
 * @interface
 * 
 * The request to be created.
 * @property {string} type - The type of the request
 * @property {any} data - The data of the request
 * @property {string} submitter_id - The associated submitter's ID.
 * @property {string} reviewer_id - The associated reviewer's ID.
 * @property {string} reviewer_note - The reviewer note of the request
 * @property {RequestStatus} status - The status of the request

 */
export type CreateRequestDTO = {
  /**
 * *
 * The type of the request

 */
type: string
  /**
 * *
 * The data of the request

 */
data: any
  /**
 * *
 * The associated submitter's ID.

 */
submitter_id: string
  /**
 * *
 * The associated reviewer's ID.

 */
reviewer_id?: string
  /**
 * *
 * The reviewer note of the request

 */
reviewer_note?: string
  /**
 * *
 * The status of the request

 */
status?: RequestStatus
}

/**
 * *
 * @interface
 * 
 * The attributes to update in the request.
 * @property {string} id - The ID of the request.
 * @property {string} reviewer_id - The associated reviewer's ID.
 * @property {string} reviewer_note - The reviewer note of the request
 * @property {RequestStatus} status - The status of the request

 */
export type UpdateRequestDTO = {
  /**
 * *
 * The ID of the request.

 */
id: string
  /**
 * *
 * The associated reviewer's ID.

 */
reviewer_id?: string
  /**
 * *
 * The reviewer note of the request

 */
reviewer_note?: string
  /**
 * *
 * The status of the request

 */
status: RequestStatus
}

/**
 * *
 * @interface
 * 
 * The attributes to update in the request data.
 * @property {string} id - The ID of the request data.
 * @property {string} type - The type of the request data
 * @property {any} data - The data of the request data

 */
export type UpdateRequestDataDTO = {
  /**
 * *
 * The ID of the request data.

 */
id: string
  /**
 * *
 * The type of the request data

 */
type: string
  /**
 * *
 * The data of the request data

 */
data: any
}

/**
 * *
 * @interface
 * 
 * The accept request details.
 * @property {string} id - The ID of the accept request.
 * @property {string} reviewer_id - The associated reviewer's ID.
 * @property {string} reviewer_note - The reviewer note of the accept request
 * @property {any} data - The data of the accept request
 * @property {RequestStatus} status - The status of the accept request

 */
export type AcceptRequestDTO = {
  /**
 * *
 * The ID of the accept request.

 */
id: string
  /**
 * *
 * The associated reviewer's ID.

 */
reviewer_id: string
  /**
 * *
 * The reviewer note of the accept request

 */
reviewer_note: string
  /**
 * *
 * The data of the accept request

 */
data: any
  /**
 * *
 * The status of the accept request

 */
status: RequestStatus
}
