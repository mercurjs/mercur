import { CurrencyDollar, Trash } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { useDeleteShippingOption, useShippingOptions } from "@hooks/api/shipping-options"
import { useShippingRules } from "@hooks/api/shipping-rules"
import {
  VendorShippingOptionWithPrices,
  formatOptionPrice,
  getProfileDisplayName,
} from "@pages/settings/locations/_common/shipping-methods"

const LegacyShippingOptionRow = ({
  option,
}: {
  option: VendorShippingOptionWithPrices
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { mutateAsync: deleteOption } = useDeleteShippingOption(option.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("shippingMethods.legacy.deleteConfirmation", {
        name: option.name,
      }),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: option.name,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await deleteOption(undefined, {
      onSuccess: () => {
        toast.success(
          t("shippingMethods.legacy.deleteSuccessToast", { name: option.name })
        )
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  const details = [
    getProfileDisplayName(option.shipping_profile?.name),
    formatOptionPrice(t, option),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      className="flex items-center justify-between gap-x-4 px-6 py-4"
      data-testid={`location-legacy-shipping-option-row-${option.id}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="small" leading="compact" weight="plus">
          {option.name}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {details}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-x-2">
        <Badge size="2xsmall" color="grey">
          {t("shippingMethods.legacy.badge")}
        </Badge>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <CurrencyDollar />,
                  label: t("shippingMethods.legacy.editPrice"),
                  permission: "shipping_options:edit",
                  disabled: option.price_type === "calculated",
                  to: `shipping-options/${option.id}/edit`,
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  permission: "shipping_options:manage",
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}

type LocationLegacyShippingOptionsSectionProps = {
  locationId: string
}

export const LocationLegacyShippingOptionsSection = ({
  locationId,
}: LocationLegacyShippingOptionsSectionProps) => {
  const { t } = useTranslation()

  const { shipping_options, isPending: isOptionsPending } = useShippingOptions({
    stock_location_id: locationId,
    limit: 999,
  })

  const { shipping_rules, isPending: isRulesPending } = useShippingRules({
    stock_location_id: locationId,
  })

  const legacyOptions = useMemo(() => {
    const governed = new Set(
      (shipping_rules ?? []).flatMap((rule) =>
        rule.seller_shipping_options.map((option) => option.id)
      )
    )

    return (
      (shipping_options ?? []) as unknown as VendorShippingOptionWithPrices[]
    ).filter((option) => !governed.has(option.id))
  }, [shipping_options, shipping_rules])

  if (isOptionsPending || isRulesPending || !legacyOptions.length) {
    return null
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="location-legacy-shipping-options-section"
    >
      <div className="flex flex-col px-6 py-4">
        <Heading level="h2">{t("shippingMethods.legacy.header")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("shippingMethods.legacy.description")}
        </Text>
      </div>
      {legacyOptions.map((option) => (
        <LegacyShippingOptionRow key={option.id} option={option} />
      ))}
    </Container>
  )
}
