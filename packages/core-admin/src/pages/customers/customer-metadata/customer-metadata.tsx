import { useParams } from "react-router-dom"

import { FetchError } from "@medusajs/js-sdk"
import { MetadataForm } from "@components/forms/metadata-form"
import { useCustomer, useUpdateCustomer } from "@hooks/api"

export const CustomerMetadata = () => {
  const { id } = useParams()

  const { customer, isPending, isError, error } = useCustomer(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateCustomer(id!)

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
    <div data-testid="customer-metadata">
      <MetadataForm
        metadata={customer?.metadata}
        hook={handleSubmit}
        isPending={isPending}
        isMutating={isMutating}
      />
    </div>
  )
}
