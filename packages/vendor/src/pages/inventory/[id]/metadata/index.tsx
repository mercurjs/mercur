// Route: /inventory/:id/metadata
import { useParams } from "react-router-dom"
import { useInventoryItem, useUpdateInventoryItem } from "@hooks/api"
import { MetadataForm } from "@components/forms/metadata-form"
import { RouteDrawer } from "@components/modals"
type FetchError = Error & { status?: number }

export const Component = () => {
  const { id } = useParams()
  const { inventory_item, isPending, isError, error } = useInventoryItem(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateInventoryItem(id!)

  if (isError) throw error

  const handleUpdate = async (
    params: { metadata?: Record<string, any> | null },
    callbacks: { onSuccess: () => void; onError: (error: FetchError) => void }
  ) => {
    return mutateAsync({ metadata: params.metadata ?? undefined }, callbacks)
  }

  return (
    <RouteDrawer>
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleUpdate}
        metadata={inventory_item?.metadata}
      />
    </RouteDrawer>
  )
}
