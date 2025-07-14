/**
 * *
 * @interface
 * 
 * The order return request to be created.
 * @property {string} order_id - The associated order's ID.
 * @property {string} shipping_option_id - The associated shipping option's ID.
 * @property {{ line_item_id: string; quantity: number; reason_id?: string; }[]} line_items - The line items of the order return request
 * @property {string} customer_id - The associated customer's ID.
 * @property {string} customer_note - The customer note of the order return request

 */
export type CreateOrderReturnRequestDTO = {
  order_id: string;
  shipping_option_id?: string;
  line_items: { line_item_id: string; quantity: number; reason_id?: string }[];
  customer_id: string;
  customer_note: string;
};

export type OrderReturnRequestStatus =
  | "pending"
  | "refunded"
  | "withdrawn"
  | "escalated"
  | "canceled";

/**
 * *
 * @interface
 * 
 * The vendor update order return request details.
 * @property {string} id - The ID of the vendor update order return request.
 * @property {string} vendor_reviewer_id - The associated vendor reviewer's ID.
 * @property {string} vendor_reviewer_note - The vendor reviewer note of the vendor update order return request
 * @property {Date} vendor_review_date - The associated date.
 * @property {OrderReturnRequestStatus} status - The status of the vendor update order return request

 */
export type VendorUpdateOrderReturnRequestDTO = {
  id: string;
  vendor_reviewer_id: string;
  vendor_reviewer_note: string;
  vendor_review_date: Date;
  status: OrderReturnRequestStatus;
  location_id?: string;
};

/**
 * *
 * @interface
 * 
 * The admin update order return request details.
 * @property {string} id - The ID of the admin update order return request.
 * @property {string} admin_reviewer_id - The associated admin reviewer's ID.
 * @property {string} admin_reviewer_note - The admin reviewer note of the admin update order return request
 * @property {Date} admin_review_date - The associated date.
 * @property {OrderReturnRequestStatus} status - The status of the admin update order return request

 */
export type AdminUpdateOrderReturnRequestDTO = {
  id: string;
  admin_reviewer_id: string;
  admin_reviewer_note: string;
  admin_review_date: Date;
  status: OrderReturnRequestStatus;
  location_id?: string;
};
