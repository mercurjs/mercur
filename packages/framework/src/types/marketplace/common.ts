import {
  BigNumberInput,
  CartDTO,
  CustomerDTO,
  FulfillmentStatus,
  OrderDTO,
  OrderDetailDTO,
  OrderStatus,
  PaymentCollectionDTO,
  PaymentCollectionStatus,
  SalesChannelDTO,
} from "@medusajs/framework/types";

/**
 * *
 * @interface
 *
 * The order set details.
 * @property {string} id - The ID of the order set.
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.
 * @property {number} display_id - The associated display's ID.
 * @property {string} customer_id - The associated customer's ID.
 * @property {CustomerDTO} customer - The customer of the order set
 * @property {string} cart_id - The associated cart's ID.
 * @property {CartDTO} cart - The cart of the order set
 * @property {string} sales_channel_id - The associated sales channel's ID.
 * @property {SalesChannelDTO} sales_channel - The sales channel of the order set
 * @property {string} payment_collection_id - The associated payment collection's ID.
 * @property {PaymentCollectionDTO} payment_collection - The payment collection of the order set
 */
export type OrderSetDTO = {
  /**
 * *
 * The ID of the order set.

 */
  id: string;
  /**
 * *
 * The associated date.

 */
  created_at: Date;
  /**
 * *
 * The associated date.

 */
  updated_at: Date;
  /**
 * *
 * The associated display's ID.

 */
  display_id: number;
  /**
 * *
 * The associated customer's ID.

 */
  customer_id?: string;
  /**
 * *
 * The customer of the order set

 */
  customer?: CustomerDTO;
  /**
 * *
 * The associated cart's ID.

 */
  cart_id: string;
  /**
 * *
 * The cart of the order set

 */
  cart?: CartDTO;

  /**
 * *
 * The associated sales channel's ID.

 */
  sales_channel_id?: string;
  /**
 * *
 * The sales channel of the order set

 */
  sales_channel?: SalesChannelDTO;

  /**
 * *
 * The associated payment collection's ID.

 */
  payment_collection_id?: string;
  /**
 * *
 * The payment collection of the order set

 */
  payment_collection?: PaymentCollectionDTO;
};

/**
 * *
 * @interface
 *
 * The order set with orders details.
 * @property {OrderDTO & OrderDetailDTO[]} orders - The list of orders in the order set
 */
export type OrderSetWithOrdersDTO = OrderSetDTO & {
  /**
 * *
 * The list of SUMMARY

 */
  orders: (OrderDTO & OrderDetailDTO)[];
};

/**
 * *
 * @interface
 *
 * The formatted order set details.
 * @property {OrderStatus} status - The status of the order set
 * @property {PaymentCollectionStatus} payment_status - The payment status of the order set
 * @property {FulfillmentStatus} fulfillment_status - The fulfillment status of the order set
 * @property {BigNumberInput} total - The total of the order set
 * @property {BigNumberInput} tax_total - The tax total of the order set
 * @property {BigNumberInput} subtotal - The subtotal of the order set
 * @property {BigNumberInput} shipping_total - The shipping total of the order set
 * @property {BigNumberInput} shipping_tax_total - The shipping tax total of the order set
 */
export type FormattedOrderSetDTO = OrderSetDTO & {
  /**
 * *
 * SUMMARY

 */
  status: OrderStatus;
  /**
 * *
 * SUMMARY

 */
  payment_status: PaymentCollectionStatus;
  /**
 * *
 * SUMMARY

 */
  fulfillment_status: FulfillmentStatus;

  /**
 * *
 * SUMMARY

 */
  total: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  tax_total: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  subtotal: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  shipping_total: BigNumberInput;
  /**
 * *
 * SUMMARY

 */
  shipping_tax_total: BigNumberInput;
};
