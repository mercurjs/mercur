import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { MetadataForm } from "@components/forms/metadata-form/metadata-form"
import { useCollection, useUpdateCollection } from "@hooks/api"
import { ClientError } from "@mercurjs/client"

export const CollectionMetadata = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const { collection, isPending, isError, error } = useCollection(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateCollection(id!)

  if (isError) {
    throw error
  }

  const handleSubmit = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: { onSuccess?: () => void; onError?: (error: ClientError | string) => void }
  ) => {
    try {
      const result = await mutateAsync({
        metadata: params.metadata === undefined ? undefined : params.metadata,
      })
      callbacks.onSuccess?.()

      return result
    } catch (error) {
      const message = error instanceof ClientError ? error.message : t("errorBoundary.defaultTitle")
      callbacks.onError?.(message)
      throw error
    }
  }

  return (
    <MetadataForm
      metadata={collection?.metadata}
      hook={handleSubmit}
      isPending={isPending}
      isMutating={isMutating}
    />
  )
}
