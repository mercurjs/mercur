import { PauseSolid, PlaySolid, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { ActionMenu, SectionRow } from "@mercurjs/dashboard-shared"
import { useNavigate } from "react-router-dom"

import {
  useDeleteMagentoWebhook,
  useUpdateMagentoWebhook,
} from "../../../../../hooks/api/magento"
import { useActionBlocker } from "../../../../../hooks/use-action-blocker"
import type { MagentoWebhook } from "../../../../../lib/client"

export const MagentoWebhookGeneralSection = ({ webhook }: { webhook: MagentoWebhook }) => {
  const navigate = useNavigate()
  const prompt = usePrompt()
  const editBlocker = useActionBlocker("integrations", "edit")
  const deleteBlocker = useActionBlocker("integrations", "manage")

  const { mutateAsync: update } = useUpdateMagentoWebhook(webhook.id, {
    onError: (e) => toast.error(e.message),
  })
  const { mutateAsync: remove } = useDeleteMagentoWebhook(webhook.id, {
    onSuccess: () => {
      toast.success("Webhook endpoint deleted")
      navigate("/settings/magento", { replace: true })
    },
    onError: (e) => toast.error(e.message),
  })

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete webhook endpoint?",
      description:
        "Magento will stop receiving events at this URL. Delivery history for it is removed.",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) {
      await remove()
    }
  }

  return (
    <Container className="divide-y p-0" data-testid="magento-webhook-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{webhook.description || "Webhook endpoint"}</Heading>
        <div className="flex items-center gap-x-2">
          {webhook.is_active ? (
            <StatusBadge color="green">Active</StatusBadge>
          ) : (
            <StatusBadge color="grey">Paused</StatusBadge>
          )}
          <ActionMenu
            groups={[
              {
                actions: [
                  webhook.is_active
                    ? {
                        label: "Pause",
                        icon: <PauseSolid />,
                        onClick: () => update({ is_active: false }),
                        ...editBlocker,
                      }
                    : {
                        label: "Resume",
                        icon: <PlaySolid />,
                        onClick: () => update({ is_active: true }),
                        ...editBlocker,
                      },
                ],
              },
              {
                actions: [
                  {
                    label: "Delete",
                    icon: <Trash />,
                    onClick: handleDelete,
                    ...deleteBlocker,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow title="ID" value={webhook.id} />
      <SectionRow title="URL" value={webhook.url} />
      <SectionRow
        title="Events"
        value={
          <div className="flex flex-wrap gap-1">
            {webhook.events.map((event) => (
              <Badge key={event} size="2xsmall">
                {event}
              </Badge>
            ))}
          </div>
        }
      />
      <SectionRow title="Signature" value="HMAC-SHA256 in the x-mercur-signature header" />
      <SectionRow title="Created" value={new Date(webhook.created_at).toLocaleString()} />
    </Container>
  )
}
