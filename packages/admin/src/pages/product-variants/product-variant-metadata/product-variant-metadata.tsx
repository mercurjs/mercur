import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form/metadata-form"
import { useProductVariant, useUpdateProductVariant } from "@hooks/api"
import { FetchError } from "@medusajs/js-sdk"

export const ProductVariantMetadata = () => {
  const { id, variant_id } = useParams()

  const { variant, isPending, isError, error } = useProductVariant(
    id!,
    variant_id!
  )

  const { mutateAsync, isPending: isMutating } = useUpdateProductVariant(
    id!,
    variant_id!
  )

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
      metadata={variant?.metadata}
      hook={handleSubmit}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
