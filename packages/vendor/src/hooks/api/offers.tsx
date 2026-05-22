import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const OFFERS_QUERY_KEY = "offers" as const;
export const offerQueryKeys = queryKeysFactory(OFFERS_QUERY_KEY);

export const useOffers = (
  query?: InferClientInput<typeof sdk.vendor.offers.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.offers.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.offers.query({ ...query }),
    queryKey: offerQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOffer = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.vendor.offers.$id.query>, "$id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.offers.$id.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.offers.$id.query({ $id: id, ...query }),
    queryKey: offerQueryKeys.detail(id, query),
    enabled: !!id,
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateOffer = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.offers.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.offers.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.offers.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBulkCreateOffers = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.offers.batch.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.offers.batch.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.offers.batch.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateOffer = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.offers.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.offers.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.offers.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchOfferInventoryItems = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.offers.$id.inventoryItems.batch.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.offers.$id.inventoryItems.batch.mutate
      >,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.offers.$id.inventoryItems.batch.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteOffer = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.offers.$id.delete>,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.offers.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      queryClient.removeQueries({
        queryKey: offerQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export type BulkDeleteOffersResult = {
  succeeded: string[];
  failed: { id: string; error: ClientError }[];
};

export const useBulkDeleteOffers = (
  options?: UseMutationOptions<BulkDeleteOffersResult, ClientError, string[]>,
) => {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => sdk.vendor.offers.$id.delete({ $id: id })),
      );
      const succeeded = results
        .map((r, i) => (r.status === "fulfilled" ? ids[i] : null))
        .filter((x): x is string => x !== null);
      const failed = results
        .map((r, i) =>
          r.status === "rejected"
            ? { id: ids[i], error: r.reason as ClientError }
            : null,
        )
        .filter(
          (x): x is { id: string; error: ClientError } => x !== null,
        );
      return { succeeded, failed };
    },
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: offerQueryKeys.lists(),
      });
      result.succeeded.forEach((id) => {
        queryClient.removeQueries({
          queryKey: offerQueryKeys.detail(id),
        });
      });
      options?.onSuccess?.(result, variables, context);
    },
    ...options,
  });
};
