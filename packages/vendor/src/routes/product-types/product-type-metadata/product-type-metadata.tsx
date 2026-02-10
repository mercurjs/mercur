import { useParams } from "react-router-dom"
import { MetadataForm } from "../../../components/forms/metadata-form/metadata-form"
import { useProductType, useUpdateProductType } from "../../../hooks/api"

export const ProductTypeMetadata = () => {
  const { id } = useParams()

  const { product_type, isPending, isError, error } = useProductType(id!)

  const { mutateAsync, isPending: isMutating } = useUpdateProductType(
    product_type?.id!
  )

  if (isError) {
    throw error
  }

  return (
    <MetadataForm
      metadata={product_type?.metadata}
      hook={mutateAsync}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
