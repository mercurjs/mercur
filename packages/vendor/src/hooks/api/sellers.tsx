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
import { membersQueryKeys } from "./members";

const SELLERS_QUERY_KEY = "sellers" as const;
export const sellersQueryKeys = queryKeysFactory(SELLERS_QUERY_KEY);

export const useSellers = (
  query?: InferClientInput<typeof sdk.vendor.sellers.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.vendor.sellers.query>,
      ClientError
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: sellersQueryKeys.list(query),
    queryFn: () => sdk.vendor.sellers.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSelectSeller = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.select.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.sellers.select.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.sellers.select.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.sellers.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerAddress = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.address.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.sellers.$id.address.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.address.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerPaymentDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.paymentDetails.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.sellers.$id.paymentDetails.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.paymentDetails.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerProfessionalDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.professionalDetails.mutate>,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.sellers.$id.professionalDetails.mutate
      >,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.professionalDetails.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteSellerProfessionalDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.professionalDetails.delete>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.sellers.$id.professionalDetails.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.me(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateSellerAccount = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.sellers.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.sellers.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.all,
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
