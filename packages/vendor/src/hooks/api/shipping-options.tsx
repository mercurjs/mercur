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
import { stockLocationsQueryKeys } from "./stock-locations";

const SHIPPING_OPTIONS_QUERY_KEY = "shipping_options" as const;
export const shippingOptionsQueryKeys = queryKeysFactory(
  SHIPPING_OPTIONS_QUERY_KEY
);

export const useShippingOption = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.shippingOptions.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.shippingOptions.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingOptions.$id.query({ id, ...query }),
    queryKey: shippingOptionsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useShippingOptions = (
  query?: InferClientInput<typeof sdk.admin.shippingOptions.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.shippingOptions.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingOptions.query({ ...query }),
    queryKey: shippingOptionsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateShippingOptions = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptions.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.shippingOptions.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingOptions.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateShippingOptions = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptions.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.shippingOptions.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.shippingOptions.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteShippingOption = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingOptions.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingOptions.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
