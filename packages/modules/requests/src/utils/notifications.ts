import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * @interface RequestNotificationParams
 * @description Represents the parameters for sending a request notification.
 * @property {MedusaContainer} container - The container for the request notification.
 * @property {string} requestId - The request's ID.
 * @property {string} requestType - The request's type.
 * @property {string} template - The template for the request notification.
 */
interface RequestNotificationParams {
  container: MedusaContainer;
  requestId: string;
  requestType: string;
  template: string;
}

const notificationResources = {
  product_type: "value",
  product_category: "name",
  product_collection: "title",
  product_tag: "value",
  product: "title",
};

/**
 * *
 * This function "sends a notification to the vendor regarding a UI request"
 * 
 * @param {RequestNotificationParams} __0 - Context for sending vendor UI notification requests
 * @returns {Promise<void>} Resolves when Sends notifications to vendors about incoming UI requests.

 */
export async function sendVendorUIRequestNotification({
  container,
  requestId,
  requestType,
  template,
}: RequestNotificationParams) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [request],
  } = await query.graph({
    entity: "request",
    fields: ["*"],
    filters: {
      id: requestId,
    },
  });

  if (!request || request.type !== requestType) {
    return;
  }

  const resource = notificationResources[requestType];
  const resourceValue = request.data[resource];

  const {
    data: [member],
  } = await query.graph({
    entity: "member",
    fields: ["*"],
    filters: {
      id: request.submitter_id,
    },
  });

  if (!member || !member.seller_id) {
    return;
  }

  const payload = {};
  payload[resource] = resourceValue;

  await notificationService.createNotifications([
    {
      to: member.seller_id,
      channel: "seller_feed",
      template,
      data: { ...payload },
    },
  ]);
}
