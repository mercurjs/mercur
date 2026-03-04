import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useShippingProfile } from "../../../hooks/api/shipping-profiles"
import { ShippingProfileGeneralSection } from "./components/shipping-profile-general-section"

import { SingleColumnPage } from "../../../components/layout/pages"
import { shippingProfileLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { shipping_profile_id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingProfileLoader>
  >

  const { shipping_profile, isLoading, isError, error } = useShippingProfile(
    shipping_profile_id!,
    undefined,
    { initialData }
  )

  if (isLoading || !shipping_profile) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage showMetadata showJSON data={shipping_profile}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showMetadata showJSON data={shipping_profile}>
      <ShippingProfileGeneralSection profile={shipping_profile} />
    </SingleColumnPage>
  )
}

export const ShippingProfileDetailPage = Object.assign(Root, {
  GeneralSection: ShippingProfileGeneralSection,
})
