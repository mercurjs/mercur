import { PencilSquare, Trash } from "@medusajs/icons"
import { AdminCampaignResponse } from "@medusajs/types"
import {
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "@components/common/action-menu"
import { useDeleteCampaign } from "@hooks/api/campaigns"
import {
  campaignStatus,
  statusColor,
} from "../../../common/utils/campaign-status"

type CampaignGeneralSectionProps = {
  campaign: AdminCampaignResponse["campaign"]
}

export const CampaignGeneralSection = ({
  campaign,
}: CampaignGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeleteCampaign(campaign.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("campaigns.delete.title"),
      description: t("campaigns.delete.description", {
        name: campaign.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("campaigns.delete.successToast", {
            name: campaign.name,
          })
        )

        navigate("/campaigns", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const status = campaignStatus(campaign)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="campaign" zone="general" id="name" data={campaign}>
          <Heading>{campaign.name}</Heading>
        </DisplayField>

        <div className="flex items-center gap-x-4">
          <DisplayField
            model="campaign"
            zone="general"
            id="status"
            data={campaign}
          >
            <StatusBadge color={statusColor(status)}>
              {t(`campaigns.status.${status}`)}
            </StatusBadge>
          </DisplayField>

          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    to: `/campaigns/${campaign.id}/edit`,
                  },
                ],
              },
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <DisplayField
        model="campaign"
        zone="general"
        id="description"
        data={campaign}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.description")}
          </Text>

          <Text size="small" leading="compact">
            {campaign.description || "-"}
          </Text>
        </div>
      </DisplayField>

      <DisplayField
        model="campaign"
        zone="general"
        id="campaign_identifier"
        data={campaign}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("campaigns.fields.identifier")}
          </Text>

          <Text size="small" leading="compact">
            {campaign.campaign_identifier}
          </Text>
        </div>
      </DisplayField>

      <DisplayExtensionZone
        model="campaign"
        zone="general"
        data={campaign}
        builtInFieldIds={[
          "name",
          "status",
          "campaign_identifier",
          "description",
        ]}
      />
    </Container>
  )
}
