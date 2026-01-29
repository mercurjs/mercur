import { useParams } from "react-router-dom"

import { FetchError } from "@medusajs/js-sdk"
import { useCustomerGroup, useUpdateCustomerGroup } from "@hooks/api"
import { MetadataForm } from "@components/forms/metadata-form"

export const CustomerGroupMetadata = () => {
  const { id } = useParams()

  const { customer_group, isPending, isError, error } = useCustomerGroup(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateCustomerGroup(id!)

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
    <div data-testid="customer-group-metadata">
      <MetadataForm
        metadata={customer_group?.metadata}
        hook={handleSubmit}
        isPending={isPending}
        isMutating={isMutating}
      />
    </div>
  )
}
