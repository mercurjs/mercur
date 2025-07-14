import { model } from "@medusajs/framework/utils";

/**
 * @class Request
 * @description Represents a request in the system.
 *
 * This model defines the structure for storing request information. Each request
 * is associated with a specific type, data, submitter, reviewer, reviewer note, and status.
 */
export const Request = model.define("request", {
  /**
   * @property {string} id - Unique identifier for the request
   * @description Auto-generated primary key with prefix 'req'
   * @example "req_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "req" }).primaryKey(),
  /**
   * @property {string} type - The type of the request
   * @description The type of the request
   * @example "seller_onboarding"
   */
  type: model.text(),
  /**
   * @property {string} data - The data of the request
   * @description The data of the request
   * @example "request_data"
   */
  data: model.json(),
  /**
   * @property {string} submitter_id - The submitter id of the request
   * @description The submitter id of the request
   * @example "submitter_id"
   */
  submitter_id: model.text().nullable(),
  /**
   * @property {string} reviewer_id - The reviewer id of the request
   * @description The reviewer id of the request
   * @example "reviewer_id"
   */
  reviewer_id: model.text().nullable(),
  /**
   * @property {string} reviewer_note - The reviewer note of the request
   * @description The reviewer note of the request
   * @example "reviewer_note"
   */
  reviewer_note: model.text().nullable(),
  /**
   * @property {string} status - The status of the request
   * @description The status of the request
   * @example "pending"
   */
  status: model
    .enum(["draft", "pending", "accepted", "rejected"])
    .default("pending"),
});
