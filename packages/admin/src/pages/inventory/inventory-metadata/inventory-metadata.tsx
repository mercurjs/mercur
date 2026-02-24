import { useParams } from "react-router-dom"

import { useInventoryItem, useUpdateInventoryItem } from "@hooks/api"
import { MetadataForm } from "@components/forms/metadata-form"
import { RouteDrawer } from "@components/modals"
import { FetchError } from "@medusajs/js-sdk"

export const InventoryItemMetadata = () => {
  const { id } = useParams()

  const { inventory_item, isPending, isError, error } = useInventoryItem(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateInventoryItem(id!)

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
    <RouteDrawer data-testid="inventory-metadata-drawer">
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleSubmit}
        metadata={inventory_item?.metadata}
      />
    </RouteDrawer>
  )
}
