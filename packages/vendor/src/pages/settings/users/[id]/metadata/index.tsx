import { useParams } from "react-router-dom"
import { MetadataForm } from "@components/forms/metadata-form"
import { RouteDrawer } from "@components/modals"
import { useUpdateUser, useUser } from "@hooks/api"
type FetchError = Error & { status?: number }

const UserMetadata = () => {
  const { id } = useParams()

  const { user, isPending, isError, error } = useUser(id!)
  const { mutateAsync, isPending: isMutating } = useUpdateUser(id!)

  if (isError) {
    throw error
  }

  const handleUpdate = async (
    params: { metadata?: Record<string, any> | null },
    callbacks: { onSuccess: () => void; onError: (error: FetchError) => void }
  ) => {
    return mutateAsync(
      { metadata: params.metadata ?? undefined },
      callbacks
    )
  }

  return (
    <RouteDrawer>
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleUpdate}
        metadata={user?.metadata}
      />
    </RouteDrawer>
  )
}

export const Component = UserMetadata
