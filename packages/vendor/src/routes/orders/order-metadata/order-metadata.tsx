import { useParams } from "react-router-dom"
import { MetadataForm } from "../../../components/forms/metadata-form/metadata-form"
import { useOrder, useUpdateOrder } from "../../../hooks/api"

export const OrderMetadata = () => {
  const { id } = useParams()

  const { order, isPending, isError, error } = useOrder(id!, {
    fields: "id,metadata",
  })

  const { mutateAsync, isPending: isMutating } = useUpdateOrder(order?.id!)

  if (isError) {
    throw error
  }

  return (
    <MetadataForm
      metadata={order?.metadata}
      hook={mutateAsync}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
