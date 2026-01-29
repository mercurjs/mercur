import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form/metadata-form"
import { useProductType, useUpdateProductType } from "@hooks/api"
import { FetchError } from "@medusajs/js-sdk"

export const ProductTypeMetadata = () => {
  const { id } = useParams()

  const { product_type, isPending, isError, error } = useProductType(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateProductType(id!)

  if (isError) {
    throw error
  }

  const handleSubmit = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: { onSuccess?: () => void; onError?: (error: FetchError | string) => void }
  ) => {
    try {
      const result = await mutateAsync({
        metadata: params.metadata === undefined ? undefined : params.metadata,
      })
      callbacks.onSuccess?.()

      return result
    } catch (error) {
      const message = error instanceof FetchError ? error.message : 'An error occurred'
      callbacks.onError?.(message)
      throw error
    }
  }

  return (
    <MetadataForm
      metadata={product_type?.metadata}
      hook={handleSubmit}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
