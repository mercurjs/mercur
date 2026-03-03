import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useShippingOptionType } from "../../../hooks/api"
import { ShippingOptionTypeGeneralSection } from "./components/shipping-option-type-general-section"
import { shippingOptionTypeLoader } from "./loader"

const ALLOWED_TYPES = [ShippingOptionTypeGeneralSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
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

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage showJSON showMetadata data={shipping_option_type}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={shipping_option_type}>
      <ShippingOptionTypeGeneralSection
        shippingOptionType={shipping_option_type}
      />
    </SingleColumnPage>
  )
}

export const ShippingOptionTypeDetailPage = Object.assign(Root, {
  GeneralSection: ShippingOptionTypeGeneralSection,
})
