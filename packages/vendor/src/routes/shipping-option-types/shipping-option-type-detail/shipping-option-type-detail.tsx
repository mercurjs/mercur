import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useShippingOptionType } from "../../../hooks/api"
import { useExtension } from "../../../providers/extension-provider"
import { ShippingOptionTypeGeneralSection } from "./components/shipping-option-type-general-section"
import { shippingOptionTypeLoader } from "./loader"

export const ShippingOptionTypeDetail = () => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingOptionTypeLoader>
  >

  const { shipping_option_type, isPending, isError, error } =
    useShippingOptionType(id!, undefined, {
      initialData,
    })

  const { getWidgets } = useExtension()

  if (isPending || !shipping_option_type) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("shipping_option_type.details.after"),
        before: getWidgets("shipping_option_type.details.before"),
      }}
      showJSON
      showMetadata
      data={shipping_option_type}
    >
      <ShippingOptionTypeGeneralSection
        shippingOptionType={shipping_option_type}
      />
    </SingleColumnPage>
  )
}
