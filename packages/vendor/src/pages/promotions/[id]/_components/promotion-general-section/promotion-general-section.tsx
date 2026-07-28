import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "@components/common/action-menu"
import { useDeletePromotion } from "@hooks/api/promotions"
import { formatCurrency } from "@lib/format-currency"
import { formatPercentage } from "@lib/percentage-helpers"
import { getPromotionStatus } from "@lib/promotions"

type PromotionGeneralSectionProps = {
  promotion: HttpTypes.AdminPromotion
}

function getTypeLabelKey(promotion: HttpTypes.AdminPromotion) {
  if (promotion.type === "buyget") {
    return "promotions.form.type.buyget.title"
  }

  const method = promotion.application_method?.type
  const target = promotion.application_method?.target_type

  if (!method || !target) {
    return null
  }

  const kind = method === "fixed" ? "amount" : "percentage"
  const scope =
    target === "shipping_methods"
      ? "Shipping"
      : target === "order"
        ? "Order"
        : "Items"

  return `promotions.fields.typeLabels.${kind}${scope}`
}

function getDisplayValue(promotion: HttpTypes.AdminPromotion) {
  const value = promotion.application_method?.value

  if (!value) {
    return null
  }

  if (promotion.application_method?.type === "fixed") {
    const currency = promotion.application_method?.currency_code

    if (!currency) {
      return null
    }

    return formatCurrency(value, currency)
  } else if (promotion.application_method?.type === "percentage") {
    return formatPercentage(value)
  }

  return null
}

export const PromotionGeneralSection = ({
  promotion,
}: PromotionGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeletePromotion(promotion.id)

  const handleDelete = async () => {
    const confirm = await prompt({
      title: t("general.areYouSure"),
      description: t("promotions.deleteWarning", {
        code: promotion.code,
      }),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: promotion.code,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirm) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("/promotions", { replace: true })
      },
    })
  }

  const displayValue = getDisplayValue(promotion)
  const typeLabelKey = getTypeLabelKey(promotion)
  const usageLimit = promotion.limit
  const [statusColor, statusText] = getPromotionStatus(promotion)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <DisplayField model="promotion" zone="general" id="code" data={promotion}>
            <Heading>{promotion.code}</Heading>
          </DisplayField>
        </div>

        <div className="flex items-center gap-x-4">
          <DisplayField
            model="promotion"
            zone="general"
            id="status"
            data={promotion}
          >
            <StatusBadge color={statusColor}>{statusText}</StatusBadge>
          </DisplayField>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    to: `/promotions/${promotion.id}/edit`,
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

      <DisplayField model="promotion" zone="general" id="type" data={promotion}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.type")}
          </Text>

          <Text size="small" leading="compact" className="text-pretty">
            {typeLabelKey ? t(typeLabelKey) : "-"}
          </Text>
        </div>
      </DisplayField>

      <DisplayField
        model="promotion"
        zone="general"
        id="is_automatic"
        data={promotion}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.method")}
          </Text>

          <Text size="small" leading="compact" className="text-pretty">
            {promotion.is_automatic
              ? t("promotions.form.method.automatic.title")
              : t("promotions.form.method.code.title")}
          </Text>
        </div>
      </DisplayField>

      <DisplayField
        model="promotion"
        zone="general"
        id="code_value"
        data={promotion}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("fields.code")}
          </Text>

          <Copy
            content={promotion.code!}
            className="text-ui-tag-neutral-text"
            asChild
          >
            <Badge
              size="2xsmall"
              rounded="full"
              className="cursor-pointer text-pretty"
            >
              {promotion.code}
            </Badge>
          </Copy>
        </div>
      </DisplayField>

      <DisplayField
        model="promotion"
        zone="general"
        id="tax_inclusive"
        data={promotion}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.taxInclusive")}
          </Text>

          <Text size="small" leading="compact" className="text-pretty">
            {promotion.is_tax_inclusive ? t("general.yes") : t("general.no")}
          </Text>
        </div>
      </DisplayField>

      <DisplayField model="promotion" zone="general" id="value" data={promotion}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.value")}
          </Text>

          <div className="flex items-center gap-x-2">
            <Text className="inline" size="small" leading="compact">
              {displayValue || "-"}
            </Text>
            {promotion?.application_method?.type === "fixed" && (
              <Badge size="2xsmall" rounded="full">
                {promotion?.application_method?.currency_code?.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </DisplayField>

      <DisplayField
        model="promotion"
        zone="general"
        id="allocation"
        data={promotion}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.allocation")}
          </Text>

          <Text
            size="small"
            leading="compact"
            className="text-pretty capitalize"
          >
            {promotion.application_method?.allocation}
          </Text>
        </div>
      </DisplayField>

      <DisplayField
        model="promotion"
        zone="general"
        id="usage_limit"
        data={promotion}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("promotions.fields.usageLimit")}
          </Text>

          <Text size="small" leading="compact" className="text-pretty">
            {usageLimit ?? t("promotions.fields.unlimited")}
          </Text>
        </div>
      </DisplayField>

      <DisplayExtensionZone
        model="promotion"
        zone="general"
        data={promotion}
        builtInFieldIds={[
          "code",
          "status",
          "type",
          "is_automatic",
          "code_value",
          "tax_inclusive",
          "value",
          "allocation",
          "usage_limit",
        ]}
      />
    </Container>
  )
}
