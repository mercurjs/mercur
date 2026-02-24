import { MetadataForm } from "@components/forms/metadata-form"
import { RouteDrawer } from "@components/modals"
import { useStore, useUpdateStore } from "@hooks/api"
import { ClientError } from "@mercurjs/client"

export const StoreMetadata = () => {
  const { store, isPending, isError, error } = useStore()

  const { mutateAsync, isPending: isMutating } = useUpdateStore(store?.id ?? '')

  if (isError) {
    throw error
  }

  const handleSubmit = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: { onSuccess?: () => void; onError?: (error: ClientError | string) => void }
  ) => {
    if (!store?.id) {
      callbacks.onError?.('Store ID not available')

      return
    }

    try {
      const result = await mutateAsync({
        metadata: params.metadata === undefined ? undefined : params.metadata,
      })
      callbacks.onSuccess?.()

      return result
    } catch (error) {
      const message = error instanceof ClientError ? error.message : 'An error occurred'
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
        metadata={store?.metadata}
      />
    </RouteDrawer>
  )
}
