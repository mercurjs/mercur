import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

interface RequestNotificationParams {
  container: MedusaContainer
  requestId: string
  requestType: string
  template: string
}

const notificationResources = {
  product_type: 'value',
  product_category: 'name',
  product_collection: 'title',
  product_tag: 'value',
  product: 'title'
}

export async function sendVendorUIRequestNotification({
  container,
  requestId,
  requestType,
  template
}: RequestNotificationParams) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request]
  } = await query.graph({
    entity: 'request',
    fields: ['*'],
    filters: {
      id: requestId
    }
  })

  if (!request || request.type !== requestType) {
    return
  }

  const resource = notificationResources[requestType]
  const resourceValue = request.data[resource]

  const {
    data: [member]
  } = await query.graph({
    entity: 'member',
    fields: ['*'],
    filters: {
      id: request.submitter_id
    }
  })

  if (!member || !member.seller_id) {
    return
  }

  const payload = {}
  payload[resource] = resourceValue

  await notificationService.createNotifications([
    {
      to: member.seller_id,
      channel: 'seller_feed',
      template,
      data: { ...payload }
    }
  ])
}
