import { PencilSquare, Trash } from "@medusajs/icons"
import { AdminCampaignResponse } from "@medusajs/types"
import {
  Badge,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteCampaign } from "../../../../../hooks/api/campaigns"
import { currencies } from "../../../../../lib/data/currencies"
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
    <Container className="divide-y p-0" data-testid="campaign-general-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="campaign-general-section-header">
        <Heading data-testid="campaign-general-section-name">{campaign.name}</Heading>

        <div className="flex items-center gap-x-4">
          <StatusBadge color={statusColor(status)} data-testid="campaign-general-section-status">
            {t(`campaigns.status.${status}`)}
          </StatusBadge>

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

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-identifier">
        <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-identifier-label">
          {t("campaigns.fields.identifier")}
        </Text>

        <Text size="small" leading="compact" data-testid="campaign-general-section-identifier-value">
          {campaign.campaign_identifier}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-description">
        <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-description-label">
          {t("fields.description")}
        </Text>

        <Text size="small" leading="compact" data-testid="campaign-general-section-description-value">
          {campaign.description || "-"}
        </Text>
      </div>

      {campaign?.budget && campaign.budget.type === "spend" && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="campaign-general-section-currency">
          <Text size="small" leading="compact" weight="plus" data-testid="campaign-general-section-currency-label">
            {t("fields.currency")}
          </Text>

          <div data-testid="campaign-general-section-currency-value">
            <Badge size="xsmall" data-testid="campaign-general-section-currency-badge">{campaign?.budget.currency_code}</Badge>
            <Text className="inline pl-3" size="small" leading="compact" data-testid="campaign-general-section-currency-name">
              {currencies[campaign?.budget.currency_code?.toUpperCase()]?.name}
            </Text>
          </div>
        </div>
      )}
    </Container>
  )
}
