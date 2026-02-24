export type OrderReturnRequestLineItemDTO = {
  id: string;
  line_item_id: string;
  quantity: number;
};

export type OrderReturnRequestDTO = {
  id: string;
  line_items: OrderReturnRequestLineItemDTO[];
  customer_id: string;
  customer_note: string;
  shipping_option_id: string | null;
  vendor_reviewer_id: string | null;
  vendor_reviewer_note: string | null;
  vendor_review_date: Date | null;
  admin_reviewer_id: string | null;
  admin_reviewer_note: string | null;
  admin_review_date: Date | null;
  status: string;
};

export type OrderItemActionEligibilityDTO = {
  item_id: string;
  item_title: string;
  can_perform_actions: boolean;
  days_remaining: number | null;
  delivered_at: Date | null;
  reason?: 'not_delivered' | 'expired' | null;
};

export type OrderActionEligibilityDTO = {
  order_id: string;
  can_perform_any_action: boolean;
  items: OrderItemActionEligibilityDTO[];
};

export interface ActionEligibilityResult {
  canPerform: boolean;
  daysRemaining: number;
}

export interface FulfillmentItem {
  id: string;
  line_item_id: string;
  quantity: number;
}

export interface Fulfillment {
  id: string;
  delivered_at: Date | string | null;
  items?: FulfillmentItem[];
}

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  fulfilled_quantity: number;
}
