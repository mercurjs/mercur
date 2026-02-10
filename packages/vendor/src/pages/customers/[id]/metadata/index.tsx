// Route: /customers/:id/metadata
import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form"
import { useCustomer, useUpdateCustomer } from "@hooks/api/customers"
type FetchError = Error & { status?: number }

export const Component = () => {
  const { id } = useParams()
  const { customer, isPending, isError, error } = useCustomer(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateCustomer(id!)

  if (!id) throw new Error("Customer ID is required")
  if (isError) throw error

  const handleUpdate = async (
    params: { metadata?: Record<string, any> | null },
    callbacks: { onSuccess: () => void; onError: (error: FetchError) => void }
  ) => {
    return mutateAsync({ metadata: params.metadata ?? undefined }, callbacks)
  }

  return (
    <MetadataForm
      metadata={customer?.metadata}
      hook={handleUpdate}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
