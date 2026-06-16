// Route: /customer-groups/:id/metadata
import { useParams } from "react-router-dom";

import { MetadataForm } from "@components/forms/metadata-form";
import {
  useCustomerGroup,
  useUpdateCustomerGroup,
} from "@hooks/api/customer-groups";

type FetchError = Error & { status?: number };

export const Component = () => {
  const { id } = useParams();
  const { customer_group, isPending, isError, error } = useCustomerGroup(id!);
  const { mutateAsync, isPending: isMutating } = useUpdateCustomerGroup(id!);

  if (!id) throw new Error("Customer group ID is required");
  if (isError) throw error;

  const handleUpdate = async (
    params: { metadata?: Record<string, unknown> | null },
    callbacks: { onSuccess: () => void; onError: (error: FetchError) => void },
  ) => {
    return mutateAsync(
      { metadata: params.metadata ?? undefined },
      callbacks,
    );
  };

  return (
    <MetadataForm
      metadata={customer_group?.metadata}
      hook={handleUpdate}
      isPending={isPending}
      isMutating={isMutating}
    />
  );
};
