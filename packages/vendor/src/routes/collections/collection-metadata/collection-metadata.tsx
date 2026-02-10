import { useParams } from "react-router-dom"
import { MetadataForm } from "../../../components/forms/metadata-form/metadata-form"
import { useCollection, useUpdateCollection } from "../../../hooks/api"

export const CollectionMetadata = () => {
  const { id } = useParams()

  const { collection, isPending, isError, error } = useCollection(id!)

  const { mutateAsync, isPending: isMutating } = useUpdateCollection(
    collection?.id!
  )

  if (isError) {
    throw error
  }

  return (
    <MetadataForm
      metadata={collection?.metadata}
      hook={mutateAsync}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
