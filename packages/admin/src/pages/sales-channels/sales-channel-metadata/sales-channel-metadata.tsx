import { useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";
import { MetadataForm } from "@components/forms/metadata-form";
import { useSalesChannel, useUpdateSalesChannel } from "@hooks/api";
import { ClientError } from "@mercurjs/client";

export const SalesChannelMetadata = () => {
  const { id } = useParams();

  const {
    sales_channel: salesChannel,
    isPending,
    isError,
    error,
  } = useSalesChannel(id!);
  const { mutateAsync, isPending: isMutating } = useUpdateSalesChannel(id!);

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
    <RouteDrawer data-testid="sales-channel-metadata-drawer">
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={handleSubmit}
        metadata={salesChannel?.metadata}
      />
    </RouteDrawer>
  );
};
