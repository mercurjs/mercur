import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form/metadata-form"
import { useProductTag, useUpdateProductTag } from "@hooks/api"
import { FetchError } from "@medusajs/js-sdk"

export const ProductTagMetadata = () => {
  const { id } = useParams()

  const { product_tag, isPending, isError, error } = useProductTag(id!)

  const { mutateAsync, isPending: isMutating } = useUpdateProductTag(id!)

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
      metadata={product_tag?.metadata}
      hook={handleSubmit}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
