import { PencilSquare, Trash, XCircle, CheckCircle } from "@medusajs/icons"
import { Badge, Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section/section-row"
import { useDeleteCommissionRate, useUpdateCommissionRate } from "../../../../../hooks/api/commission-rates"
import { CommissionRateDTO } from "@mercurjs/types"

type CommissionRateGeneralSectionProps = {
  commissionRate: CommissionRateDTO
}

export const CommissionRateGeneralSection = ({
  commissionRate,
}: CommissionRateGeneralSectionProps) => {
  const formatValue = () => {
    if (commissionRate.type === "percentage") {
      return `${commissionRate.value}%`
    }
    return commissionRate.currency_code
      ? `${commissionRate.value} ${commissionRate.currency_code.toUpperCase()}`
      : `${commissionRate.value}`
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{commissionRate.name}</Heading>
        <div className="flex items-center gap-4">
          <StatusBadge color={commissionRate.is_enabled ? "green" : "grey"}>
            {commissionRate.is_enabled ? "Enabled" : "Disabled"}
          </StatusBadge>
          <CommissionRateActions commissionRate={commissionRate} />
        </div>
      </div>
      <SectionRow
        title="Code"
        value={
          <Badge size="2xsmall" className="uppercase">
            {commissionRate.code}
          </Badge>
        }
      />
      <SectionRow
        title="Type"
        value={
          <Badge
            size="2xsmall"
            color={commissionRate.type === "percentage" ? "blue" : "grey"}
          >
            {commissionRate.type === "percentage" ? "Percentage" : "Fixed"}
          </Badge>
        }
      />
      <SectionRow title="Value" value={formatValue()} />
      <SectionRow
        title="Target"
        value={commissionRate.target === "item" ? "Item" : "Shipping"}
      />
      <SectionRow
        title="Include Tax"
        value={commissionRate.include_tax ? "Yes" : "No"}
      />
      <SectionRow title="Priority" value={String(commissionRate.priority)} />
      {commissionRate.min_amount != null && (
        <SectionRow
          title="Minimum Amount"
          value={
            commissionRate.currency_code
              ? `${commissionRate.min_amount} ${commissionRate.currency_code.toUpperCase()}`
              : String(commissionRate.min_amount)
          }
        />
      )}
    </Container>
  )
}

const CommissionRateActions = ({
  commissionRate,
}: {
  commissionRate: CommissionRateDTO
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteCommissionRate(commissionRate.id)
  const { mutateAsync: updateCommissionRate } = useUpdateCommissionRate(commissionRate.id)
  const prompt = usePrompt()

  const handleToggleEnabled = async () => {
    const newEnabled = !commissionRate.is_enabled
    await updateCommissionRate(
      { is_enabled: newEnabled },
      {
        onSuccess: () => {
          toast.success(
            newEnabled
              ? "Commission rate enabled successfully"
              : "Commission rate disabled successfully"
          )
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: `Are you sure you want to delete the commission rate "${commissionRate.name}"?`,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success("Commission rate deleted successfully")
        navigate("/settings/commission-rates", { replace: true })
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/settings/commission-rates/${commissionRate.id}/edit`,
            },
            {
              icon: commissionRate.is_enabled ? <XCircle /> : <CheckCircle />,
              label: commissionRate.is_enabled ? t("actions.disable") : t("actions.enable"),
              onClick: handleToggleEnabled,
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
  )
}
