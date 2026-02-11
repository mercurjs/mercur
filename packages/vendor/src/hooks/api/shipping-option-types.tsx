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

const SHIPPING_OPTION_TYPES_QUERY_KEY = "shipping_option_types" as const;
export const shippingOptionTypesQueryKeys = queryKeysFactory(
  SHIPPING_OPTION_TYPES_QUERY_KEY
);

export const useShippingOptionType = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.shippingOptionTypes.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingOptionTypes.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingOptionTypes.$id.query({ id, ...query }),
    queryKey: shippingOptionTypesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useShippingOptionTypes = (
  query?: InferClientInput<typeof sdk.vendor.shippingOptionTypes.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingOptionTypes.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingOptionTypes.query({ ...query }),
    queryKey: shippingOptionTypesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateShippingOptionType = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingOptionTypes.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.shippingOptionTypes.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.shippingOptionTypes.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateShippingOptionType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingOptionTypes.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.shippingOptionTypes.$id.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.shippingOptionTypes.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteShippingOptionType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingOptionTypes.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.shippingOptionTypes.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
