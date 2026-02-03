import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useShippingProfile } from "@hooks/api/shipping-profiles"
import { useExtension } from "@providers/extension-provider"
import { ShippingProfileGeneralSection } from "./_components/shipping-profile-general-section"
import { loader } from "./loader"

export const Component = () => {
  const { shipping_profile_id } = useParams()

  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { shipping_profile, isLoading, isError, error } = useShippingProfile(
    shipping_profile_id!,
    undefined,
    { initialData }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !shipping_profile) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("shipping_profile.details.before"),
        after: getWidgets("shipping_profile.details.after"),
      }}
      showMetadata
      showJSON
      data={shipping_profile}
    >
      <ShippingProfileGeneralSection profile={shipping_profile} />
    </SingleColumnPage>
  )
}

export { Breadcrumb } from "./breadcrumb"
export { loader } from "./loader"
