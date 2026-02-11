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

const SHIPPING_PROFILE_QUERY_KEY = "shipping_profile" as const;
export const shippingProfileQueryKeys = queryKeysFactory(
  SHIPPING_PROFILE_QUERY_KEY
);

export const useCreateShippingProfile = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingProfiles.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.shippingProfiles.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.shippingProfiles.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useShippingProfile = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.shippingProfiles.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingProfiles.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingProfiles.$id.query({ $id: id, ...query }),
    queryKey: shippingProfileQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useShippingProfiles = (
  query?: InferClientInput<typeof sdk.vendor.shippingProfiles.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.shippingProfiles.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.shippingProfiles.query({ ...query }),
    queryKey: shippingProfileQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingProfiles.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.shippingProfiles.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.shippingProfiles.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingProfiles.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.shippingProfiles.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
