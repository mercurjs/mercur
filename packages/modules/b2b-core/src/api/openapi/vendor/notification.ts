/**
 * @schema VendorNotification
 * title: "Notification"
 * description: "Notification object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the notification.
 *   to:
 *     type: string
 *     description: The recipient of the notification.
 *   channel:
 *     type: string
 *     description: The channel through which the notification is sent (e.g., 'feed', 'email', 'seller_feed').
 *   template:
 *     type: string
 *     description: The template used for the notification.
 *   data:
 *     type: object
 *     description: Additional data associated with the notification.
 *   content:
 *     type: object
 *     description: The content of the notification.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */
