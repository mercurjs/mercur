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
import { productsQueryKeys } from "./products";

const SALES_CHANNELS_QUERY_KEY = "sales-channels" as const;
export const salesChannelsQueryKeys = queryKeysFactory(
  SALES_CHANNELS_QUERY_KEY
);

export const useSalesChannel = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.salesChannels.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: salesChannelsQueryKeys.detail(id),
    queryFn: async () => sdk.vendor.salesChannels.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSalesChannels = (
  query?: InferClientInput<typeof sdk.vendor.salesChannels.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.salesChannels.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.salesChannels.query({ ...query }),
    queryKey: salesChannelsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateSalesChannel = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.salesChannels.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.salesChannels.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSalesChannel = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.salesChannels.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.salesChannels.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteSalesChannel = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.salesChannels.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.detail(id),
      });

      // Invalidate all products to ensure they are updated if they were linked to the sales channel
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteSalesChannelLazy = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.delete>,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (id: string) => sdk.vendor.salesChannels.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.detail(variables),
      });

      // Invalidate all products to ensure they are updated if they were linked to the sales channel
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSalesChannelRemoveProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.products.mutate>,
    ClientError,
    { remove: string[] }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.salesChannels.$id.products.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.detail(id),
      });

      // Invalidate the products that were removed
      for (const product of variables?.remove || []) {
        queryClient.invalidateQueries({
          queryKey: productsQueryKeys.detail(product),
        });
      }

      // Invalidate the products list query
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSalesChannelAddProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.salesChannels.$id.products.mutate>,
    ClientError,
    { add: string[] }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.salesChannels.$id.products.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.detail(id),
      });

      // Invalidate the products that were added
      for (const product of variables?.add || []) {
        queryClient.invalidateQueries({
          queryKey: productsQueryKeys.detail(product),
        });
      }

      // Invalidate the products list query
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
