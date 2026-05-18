import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form/metadata-form"
import {
  useProductBrand,
  useUpdateProductBrand,
} from "@hooks/api"
import { ClientError } from "@mercurjs/client"

export const ProductBrandMetadata = () => {
  const { id } = useParams()

  const { product_brand, isPending, isError, error } = useProductBrand(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateProductBrand(id!)

  if (isError) {
    throw error
  }

  const handleSubmit = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: {
      onSuccess?: () => void
      onError?: (error: ClientError | string) => void
    }
  ) => {
    try {
      const result = await mutateAsync({
        metadata: params.metadata === undefined ? undefined : params.metadata,
      })
      callbacks.onSuccess?.()

      return result
    } catch (error) {
      const message =
        error instanceof ClientError ? error.message : "An error occurred"
      callbacks.onError?.(message)
      throw error
    }
  }

  return (
    <MetadataForm
      metadata={product_brand?.metadata}
      hook={handleSubmit}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
