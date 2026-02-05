import { useParams } from "react-router-dom"
import { MetadataForm } from "../../../components/forms/metadata-form/metadata-form"
import {
  useShippingProfile,
  useUpdateShippingProfile,
} from "../../../hooks/api"

export const ShippingProfileMetadata = () => {
  const { shipping_profile_id } = useParams()

  const { shipping_profile, isPending, isError, error } = useShippingProfile(
    shipping_profile_id!
  )

  const { mutateAsync, isPending: isMutating } = useUpdateShippingProfile(
    shipping_profile?.id!
  )

  if (isError) {
    throw error
  }

  return (
    <MetadataForm
      metadata={shipping_profile?.metadata}
      hook={mutateAsync}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
