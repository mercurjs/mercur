import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useShippingOptionType } from "../../../hooks/api"
import { ShippingOptionTypeGeneralSection } from "./components/shipping-option-type-general-section"
import { shippingOptionTypeLoader } from "./loader"

export const ShippingOptionTypeDetailPage = () => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingOptionTypeLoader>
  >

  const { shipping_option_type, isPending, isError, error } =
    useShippingOptionType(id!, undefined, {
      initialData,
    })

  if (isPending || !shipping_option_type) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="shipping-option-types.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={shipping_option_type}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ShippingOptionTypeGeneralSection">
              <ShippingOptionTypeGeneralSection
                shippingOptionType={shipping_option_type}
              />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(shipping_option_type)}
          </>
        ),
      }}
    />
  )
}
