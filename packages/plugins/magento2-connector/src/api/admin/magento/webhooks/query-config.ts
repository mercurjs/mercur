export const adminMagentoWebhookFields = [
  "id",
  "url",
  "events",
  "is_active",
  "description",
  "metadata",
  "created_at",
  "updated_at",
]

export const adminMagentoWebhookDeliveryFields = [
  "id",
  "endpoint_id",
  "event",
  "payload",
  "status",
  "attempts",
  "next_attempt_at",
  "response_status",
  "response_body",
  "delivered_at",
  "created_at",
  "updated_at",
]

export const adminMagentoWebhookQueryConfig = {
  list: { defaults: adminMagentoWebhookFields, isList: true },
  retrieve: { defaults: adminMagentoWebhookFields, isList: false },
}

export const adminMagentoWebhookDeliveryQueryConfig = {
  list: { defaults: adminMagentoWebhookDeliveryFields, isList: true },
  retrieve: { defaults: adminMagentoWebhookDeliveryFields, isList: false },
}
