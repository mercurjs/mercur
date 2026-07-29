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
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteCampaign } from "../../../../../hooks/api/campaigns"
import {
  campaignStatus,
  statusColor,
} from "../../../common/utils/campaign-status"

const GENERAL_FIELD_IDS = [
  "name",
  "status",
  "campaign_identifier",
  "description",
  "owner",
]

type CampaignGeneralSectionProps = {
  campaign: AdminCampaignResponse["campaign"] & {
    seller?: { name?: string } | null
  }
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
        toast.success(t("campaigns.delete.successToast"))

        navigate("/campaigns", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const status = campaignStatus(campaign)

  return (
    <Container className="divide-y p-0" data-testid="campaign-general-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="campaign-general-section-header">
        <DisplayField model="campaign" zone="general" id="name" data={campaign}>
          <Heading data-testid="campaign-general-section-name">{campaign.name}</Heading>
        </DisplayField>

        <div className="flex items-center gap-x-4">
          <DisplayField model="campaign" zone="general" id="status" data={campaign}>
            <StatusBadge color={statusColor(status)} data-testid="campaign-general-section-status">
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
            data-testid="campaign-general-section-action-menu"
          />
        </div>
      </div>

      <DisplayField model="campaign" zone="general" id="description" data={campaign}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-description">
          <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-description-label">
            {t("fields.description")}
          </Text>

          <Text size="small" leading="compact" data-testid="campaign-general-section-description-value">
            {campaign.description || "-"}
          </Text>
        </div>
      </DisplayField>

      <DisplayField model="campaign" zone="general" id="campaign_identifier" data={campaign}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-identifier">
          <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-identifier-label">
            {t("campaigns.fields.identifier")}
          </Text>

          <Text size="small" leading="compact" data-testid="campaign-general-section-identifier-value">
            {campaign.campaign_identifier}
          </Text>
        </div>
      </DisplayField>

      <DisplayField model="campaign" zone="general" id="owner" data={campaign}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-owner">
          <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-owner-label">
            {t("campaigns.fields.owner")}
          </Text>

          <Text size="small" leading="compact" data-testid="campaign-general-section-owner-value">
            {campaign.seller?.name ?? t("campaigns.fields.platformOwner")}
          </Text>
        </div>
      </DisplayField>

      <DisplayExtensionZone
        model="campaign"
        zone="general"
        data={campaign}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  )
}
