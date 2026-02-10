import { useParams } from "react-router-dom"
import { MetadataForm } from "../../../components/forms/metadata-form/metadata-form"
import { useProductTag, useUpdateProductTag } from "../../../hooks/api"

export const ProductTagMetadata = () => {
  const { id } = useParams()

  const { product_tag, isPending, isError, error } = useProductTag(id!)

  const { mutateAsync, isPending: isMutating } = useUpdateProductTag(
    product_tag?.id!
  )

  if (isError) {
    throw error
  }

  return (
    <MetadataForm
      metadata={product_tag?.metadata}
      hook={mutateAsync}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
