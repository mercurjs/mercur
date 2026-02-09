import {
  DeleteResponse,
  FindParams,
  OperatorMap,
  PaginatedResponse,
  SelectParams,
} from "@medusajs/types";

export interface AdminRefundReason {
  /**
   * The refund reason's ID.
   */
  id: string;
  /**
   * The refund reason's label.
   *
   * @example
   * "Refund"
   */
  label: string;
  /**
   * The refund reason's code.
   *
   * @example
   * "refund"
   */
  code: string;
  /**
   * The refund reason's description.
   *
   * @example
   * "refund"
   */
  description?: string | null;
  /**
   * Custom key-value pairs that can be added to the refund reason.
   */
  metadata: Record<string, unknown> | null;
  /**
   * The date that the refund reason was created.
   */
  created_at: string;
  /**
   * The date that the refund reason was updated.
   */
  updated_at: string;
}

export interface AdminRefundReasonListParams extends FindParams {
  /**
   * A search term to search for refund reasons by label or description.
   */
  q?: string;
  /**
   * Filter by refund reason ID(s).
   */
  id?: string | string[];
  /**
   * Filter by parent refund reason ID(s).
   */
  parent_refund_reason_id?: string | OperatorMap<string | string[]>;
  /**
   * Filter by creation date.
   */
  created_at?: OperatorMap<string>;
  /**
   * Filter by update date.
   */
  updated_at?: OperatorMap<string>;
  /**
   * Apply filters on the refund reason's deletion date.
   */
  deleted_at?: OperatorMap<string>;
}

export interface AdminRefundReasonResponse {
  /**
   * The refund reason's details.
   */
  refund_reason: AdminRefundReason;
}

export interface AdminRefundReasonListResponse
  extends PaginatedResponse<{
    /**
     * The list of refund reasons.
     */
    refund_reasons: AdminRefundReason[];
  }> {}

export type AdminBaseRefundReasonPayload = {
  /**
   * The refund reason's label.
   *
   * @example
   * "Refund"
   */
  label: string;
  /**
   * The refund reason's description.
   *
   * @example
   * "refund"
   */
  description?: string;
  /**
   * Custom key-value pairs that can be added to the refund reason.
   */
  metadata?: Record<string, unknown> | null;
};

export interface AdminRefundReasonDeleteResponse
  extends DeleteResponse<"refund_reason"> {}

export interface AdminRefundReasonParams extends SelectParams {}

export interface AdminCreateRefundReason extends AdminBaseRefundReasonPayload {}

export interface AdminUpdateRefundReason extends AdminBaseRefundReasonPayload {}
