import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useCallback, useMemo } from "react"
import { DeepPartial, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { TabDefinition } from "../../../../../components/tabbed-form/types"
import { useFulfillmentProviderOptions } from "../../../../../hooks/api"
import { useCreateShippingOptions } from "../../../../../hooks/api/shipping-options"
import { castNumber } from "../../../../../lib/cast-number"
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from "../../../common/constants"
import { buildShippingOptionPriceRules } from "../../../common/utils/price-rule-helpers"
import { CreateShippingOptionDetailsForm } from "./create-shipping-option-details-form"
import { CreateShippingOptionsPricesForm } from "./create-shipping-options-prices-form"
import { CreateShippingOptionSchema } from "./schema"

export type CreateShippingOptionSchemaType = z.infer<typeof CreateShippingOptionSchema>

type CreateShippingOptionFormProps = {
  zone: HttpTypes.AdminServiceZone
  locationId: string
  isReturn?: boolean
  type: FulfillmentSetType
  children?: ReactNode
  schema?: z.ZodType<CreateShippingOptionSchemaType>
  defaultValues?: DeepPartial<CreateShippingOptionSchemaType>
}

export function CreateShippingOptionsForm({
  zone,
  isReturn,
  locationId,
  type,
  children,
  schema,
  defaultValues: extraDefaults,
}: CreateShippingOptionFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateShippingOptionSchemaType>({
    defaultValues: {
      name: "",
      price_type: ShippingOptionPriceType.FlatRate,
      enabled_in_store: true,
      shipping_profile_id: "",
      provider_id: "",
      fulfillment_option_id: "",
      region_prices: {},
      currency_prices: {},
      conditional_region_prices: {},
      conditional_currency_prices: {},
      ...extraDefaults,
    } as CreateShippingOptionSchemaType,
    resolver: zodResolver(schema ?? CreateShippingOptionSchema),
  })

  const selectedProviderId = useWatch({
    control: form.control,
    name: "provider_id",
  })

  const { fulfillment_options: fulfillmentProviderOptions } =
    useFulfillmentProviderOptions(selectedProviderId, {
      enabled: !!selectedProviderId,
    })

  const watchedPriceType = useWatch({
    control: form.control,
    name: "price_type",
  })

  const isCalculatedPriceType = watchedPriceType === ShippingOptionPriceType.Calculated

  const { mutateAsync, isPending: isLoading } = useCreateShippingOptions()

  const handleSubmit = form.handleSubmit(async (data) => {
    const currencyPrices = Object.entries(data.currency_prices)
      .map(([code, value]) => {
        if (!value) {
          return undefined
        }
        return {
          currency_code: code,
          amount: castNumber(value),
        }
      })
      .filter((p): p is { currency_code: string; amount: number } => !!p)

    const regionPrices = Object.entries(data.region_prices)
      .map(([region_id, value]) => {
        if (!value) {
          return undefined
        }
        return {
          region_id,
          amount: castNumber(value),
        }
      })
      .filter((p): p is { region_id: string; amount: number } => !!p)

    const conditionalRegionPrices = Object.entries(
      data.conditional_region_prices
    ).flatMap(([region_id, value]) => {
      const prices =
        value?.map((rule) => ({
          region_id: region_id,
          amount: castNumber(rule.amount),
          rules: buildShippingOptionPriceRules(rule),
        })) || []

      return prices?.filter(Boolean) as HttpTypes.AdminCreateShippingOptionPriceWithRegion[]
    })

    const conditionalCurrencyPrices = Object.entries(
      data.conditional_currency_prices
    ).flatMap(([currency_code, value]) => {
      const prices =
        value?.map((rule) => ({
          currency_code,
          amount: castNumber(rule.amount),
          rules: buildShippingOptionPriceRules(rule),
        })) || []

      return prices?.filter(Boolean) as HttpTypes.AdminCreateShippingOptionPriceWithCurrency[]
    })

    const allPrices = [
      ...currencyPrices,
      ...conditionalCurrencyPrices,
      ...regionPrices,
      ...conditionalRegionPrices,
    ]

    const fulfillmentOptionData = fulfillmentProviderOptions?.find(
      (fo: { id: string }) => fo.id === data.fulfillment_option_id
    )

    await mutateAsync(
      {
        name: data.name,
        price_type: data.price_type,
        service_zone_id: zone.id,
        shipping_profile_id: data.shipping_profile_id,
        provider_id: data.provider_id,
        prices: allPrices,
        data: fulfillmentOptionData as unknown as Record<string, unknown>,
        rules: [
          {
            value: isReturn ? "true" : "false",
            attribute: "is_return",
            operator: "eq",
          },
          {
            value: data.enabled_in_store ? "true" : "false",
            attribute: "enabled_in_store",
            operator: "eq",
          },
        ],
        type_id: data.shipping_option_type_id,
      },
      {
        onSuccess: ({ shipping_option }) => {
          toast.success(
            t(
              `stockLocations.shippingOptions.create.${
                isReturn ? "returns" : "shipping"
              }.successToast`,
              { name: shipping_option.name }
            )
          )
          handleSuccess(`/settings/locations/${locationId}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  const transformTabs = useCallback(
    (tabs: TabDefinition<CreateShippingOptionSchemaType>[]) => {
      return tabs.map((tab) => {
        if (tab.id === "pricing") {
          return {
            ...tab,
            isVisible: () => !isCalculatedPriceType,
          }
        }
        return tab
      })
    },
    [isCalculatedPriceType]
  )

  const defaultTabs = useMemo(
    () => [
      <CreateShippingOptionDetailsForm
        key="details"
        zone={zone}
        isReturn={isReturn}
        type={type}
        locationId={locationId}
        fulfillmentProviderOptions={fulfillmentProviderOptions || []}
        selectedProviderId={selectedProviderId}
      />,
      <CreateShippingOptionsPricesForm key="pricing" type={type} />,
    ],
    [zone, isReturn, type, locationId, fulfillmentProviderOptions, selectedProviderId]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      transformTabs={transformTabs}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
