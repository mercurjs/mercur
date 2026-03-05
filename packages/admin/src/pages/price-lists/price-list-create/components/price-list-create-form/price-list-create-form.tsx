import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes, PriceListStatus, PriceListType } from "@medusajs/types"
import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { useCreatePriceList } from "../../../../../hooks/api/price-lists"
import { exctractPricesFromProducts } from "../../../common/utils"
import { PriceListDetailsForm } from "./price-list-details-form"
import { PriceListPricesForm } from "./price-list-prices-form"
import { PriceListProductsForm } from "./price-list-products-form"
import { PricingCreateSchema, PricingCreateSchemaType } from "./schema"

export type { PricingCreateSchemaType }

type PriceListCreateFormProps = {
  regions: HttpTypes.AdminRegion[]
  currencies: HttpTypes.AdminStoreCurrency[]
  pricePreferences: HttpTypes.AdminPricePreference[]
  children?: ReactNode
  schema?: z.ZodType<PricingCreateSchemaType>
  defaultValues?: DeepPartial<PricingCreateSchemaType>
}

export const PriceListCreateForm = ({
  regions,
  currencies,
  pricePreferences,
  children,
  schema,
  defaultValues: extraDefaults,
}: PriceListCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<PricingCreateSchemaType>({
    defaultValues: {
      type: "sale",
      status: "active",
      title: "",
      description: "",
      starts_at: null,
      ends_at: null,
      product_ids: [],
      products: {},
      rules: {
        customer_group_id: [],
      },
      ...extraDefaults,
    } as PricingCreateSchemaType,
    resolver: zodResolver(schema ?? PricingCreateSchema),
  })

  const { mutateAsync, isPending } = useCreatePriceList()

  const handleSubmit = form.handleSubmit(async (data) => {
    const { rules, products } = data

    const rulesPayload = rules?.customer_group_id?.length
      ? { "customer.groups.id": rules.customer_group_id.map((cg) => cg.id) }
      : undefined

    const prices = exctractPricesFromProducts(products, regions)

    await mutateAsync(
      {
        title: data.title,
        type: data.type as PriceListType,
        status: data.status as PriceListStatus,
        description: data.description,
        starts_at: data.starts_at ? data.starts_at.toISOString() : null,
        ends_at: data.ends_at ? data.ends_at.toISOString() : null,
        rules: rulesPayload,
        prices,
      },
      {
        onSuccess: ({ price_list }) => {
          toast.success(
            t("priceLists.create.successToast", {
              title: price_list.title,
            })
          )
          handleSuccess(`../${price_list.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const defaultTabs = useMemo(
    () => [
      <PriceListDetailsForm key="detail" />,
      <PriceListProductsForm key="product" />,
      <PriceListPricesForm
        key="price"
        currencies={currencies}
        regions={regions}
        pricePreferences={pricePreferences}
      />,
    ],
    [currencies, regions, pricePreferences]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
