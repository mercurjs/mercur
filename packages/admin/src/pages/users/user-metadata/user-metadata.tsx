import { useParams } from "react-router-dom";

import { MetadataForm } from "@components/forms/metadata-form";
import { RouteDrawer } from "@components/modals";
import { useUpdateUser, useUser } from "@hooks/api";
import { ClientError } from "@mercurjs/client";

export const UserMetadata = () => {
  const { id } = useParams();

  const { user, isPending, isError, error } = useUser(id!);
  const { mutateAsync, isPending: isMutating } = useUpdateUser(id!);

  if (isError) {
    throw error;
  }

  const handleSubmit = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: {
      onSuccess?: () => void;
      onError?: (error: ClientError | string) => void;
    },
  ) => {
    try {
      const result = await mutateAsync({
        metadata: params.metadata === undefined ? undefined : params.metadata,
      });
      callbacks.onSuccess?.();

      return result;
    } catch (error) {
      const message =
        error instanceof ClientError ? error.message : "An error occurred";
      callbacks.onError?.(message);
      throw error;
    }
  };

  return (
    <RouteDrawer data-testid="user-metadata-drawer">
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleSubmit}
        metadata={user?.metadata}
      />
    </RouteDrawer>
  );
};
