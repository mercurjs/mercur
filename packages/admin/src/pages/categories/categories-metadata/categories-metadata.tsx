import { useParams } from "react-router-dom"

import {
  useProductCategory,
  useUpdateProductCategory,
} from "@hooks/api"
import { MetadataForm } from "@components/forms/metadata-form"
import { RouteDrawer } from "@components/modals"
import { FetchError } from "@medusajs/js-sdk"

export const CategoriesMetadata = () => {
  const { id } = useParams()

  const { product_category, isPending, isError, error } = useProductCategory(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateProductCategory(id!)

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
      const message = error instanceof FetchError ? error.message : 'An error occured'
      callbacks.onError?.(message)
      throw error
    }
  }

  return (
    <RouteDrawer>
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleSubmit}
        metadata={product_category?.metadata}
      />
    </RouteDrawer>
  )
}
