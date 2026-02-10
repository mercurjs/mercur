// Route: /price-lists/:id
import { useParams, LoaderFunctionArgs } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { usePriceList, priceListsQueryKeys } from "@hooks/api/price-lists"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { PriceListConfigurationSection } from "./_components/price-list-configuration-section"
import { PriceListGeneralSection } from "./_components/price-list-general-section"
import { PriceListProductSection } from "./_components/price-list-product-section"

const pricingDetailQuery = (id: string) => ({
  queryKey: priceListsQueryKeys.detail(id),
  queryFn: async () =>
    await fetchQuery(`/vendor/price-lists/${id}`, {
      method: "GET",
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = pricingDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

type PriceListDetailBreadcrumbProps = UIMatch<HttpTypes.AdminPriceListResponse>

export const Breadcrumb = (props: PriceListDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { price_list } = usePriceList(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  })

  if (!price_list) {
    return null
  }

  return <span>{price_list.title}</span>
}

export const Component = () => {
  const { id } = useParams()

  const { price_list, isLoading, isError, error } = usePriceList(id!)

  const { getWidgets } = useDashboardExtension()

  if (isLoading || !price_list) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("price_list.details.after"),
        before: getWidgets("price_list.details.before"),
        sideAfter: getWidgets("price_list.details.side.after"),
        sideBefore: getWidgets("price_list.details.side.before"),
      }}
      data={price_list}
    >
      <TwoColumnPage.Main>
        <PriceListGeneralSection priceList={price_list} />
        <PriceListProductSection priceList={price_list} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <PriceListConfigurationSection priceList={price_list} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
