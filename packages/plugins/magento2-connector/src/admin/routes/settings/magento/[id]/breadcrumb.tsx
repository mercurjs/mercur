import type { UIMatch } from "react-router-dom"

import { useMagentoWebhook } from "../../../../hooks/api/magento"

export const MagentoWebhookDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { webhook } = useMagentoWebhook(id!, { enabled: Boolean(id) })

  if (!webhook) {
    return null
  }

  return <span>{webhook.description || webhook.url}</span>
}
