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