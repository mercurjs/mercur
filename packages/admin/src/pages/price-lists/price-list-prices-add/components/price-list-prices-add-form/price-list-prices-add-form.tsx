import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { useBatchPriceListPrices } from "../../../../../hooks/api/price-lists"
import { exctractPricesFromProducts } from "../../../common/utils"
import { PriceListPricesAddPricesForm } from "./price-list-prices-add-prices-form"
import { PriceListPricesAddProductIdsForm } from "./price-list-prices-add-product-ids-form"
import { PriceListPricesAddSchema } from "./schema"

export type PriceListPricesAddSchemaType = z.infer<typeof PriceListPricesAddSchema>

type PriceListPricesAddFormProps = {
  priceList: HttpTypes.AdminPriceList
  currencies: HttpTypes.AdminStoreCurrency[]
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
  children?: ReactNode
  schema?: z.ZodType<PriceListPricesAddSchemaType>
  defaultValues?: DeepPartial<PriceListPricesAddSchemaType>
}

export const PriceListPricesAddForm = ({
  priceList,
  regions,
  currencies,
  pricePreferences,
  children,
  schema,
  defaultValues: extraDefaults,
}: PriceListPricesAddFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<PriceListPricesAddSchemaType>({
    defaultValues: {
      products: {},
      product_ids: [],
      ...extraDefaults,
    } as PriceListPricesAddSchemaType,
    resolver: zodResolver(schema ?? PriceListPricesAddSchema),
  })

  const { mutateAsync, isPending } = useBatchPriceListPrices(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const { products } = values

    const prices = exctractPricesFromProducts(products, regions)

    await mutateAsync(
      {
        create: prices,
      },
      {
        onSuccess: () => {
          toast.success(t("priceLists.products.add.successToast"))
          handleSuccess()
        },
        onError: (e) => toast.error(e.message),
      }
    )
  })

  const defaultTabs = useMemo(
    () => [
      <PriceListPricesAddProductIdsForm key="product" priceList={priceList} />,
      <PriceListPricesAddPricesForm
        key="price"
        currencies={currencies}
        regions={regions}
        pricePreferences={pricePreferences}
      />,
    ],
    [priceList, currencies, regions, pricePreferences]
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
