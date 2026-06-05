/**
 * @category Order
 * @customNamespace Order
 */
export const OrderGroupWorkflowEvents = {
    /**
     * Emitted when an order group is created.
     *
     * @eventPayload
     * ```ts
     * {
     *   id, // The ID of the order group
     * }
     * ```
     */
    CREATED: "order_group.created",
}

export const SellerWorkflowEvents = {
  CREATED: "seller.created",
  UPDATED: "seller.updated",
  DELETED: "seller.deleted",
  SUSPENDED: "seller.suspended",
  UNSUSPENDED: "seller.unsuspended",
  APPROVED: "seller.approved",
  TERMINATED: "seller.terminated",
  UNTERMINATED: "seller.unterminated",
}

export const SellerMemberWorkflowEvents = {
  CREATED: "seller_member.created",
  UPDATED: "seller_member.updated",
  DELETED: "seller_member.deleted",
}

export const MemberInviteWorkflowEvents = {
  CREATED: "member_invite.created",
  ACCEPTED: "member_invite.accepted",
}