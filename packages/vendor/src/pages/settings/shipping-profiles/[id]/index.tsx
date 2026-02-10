import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { useShippingProfile } from "@hooks/api/shipping-profiles"
import { ShippingProfileGeneralSection } from "./_components/shipping-profile-general-section"

import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { shippingProfileLoader } from "./loader"

const ShippingProfileDetail = () => {
  const { shipping_profile_id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingProfileLoader>
  >

  const { shipping_profile, isLoading, isError, error } = useShippingProfile(
    shipping_profile_id!,
    undefined,
    {
      initialData,
    }
  )

  const { getWidgets } = useDashboardExtension()

  if (isLoading || !shipping_profile) {
    return <SingleColumnPageSkeleton sections={1} />
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
      data={shipping_profile}
    >
      <ShippingProfileGeneralSection profile={shipping_profile} />
    </SingleColumnPage>
  )
}

export const Component = ShippingProfileDetail
export { shippingProfileLoader as loader } from "./loader"
export { ShippingProfileDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
