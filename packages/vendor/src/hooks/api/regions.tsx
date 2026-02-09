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
import { pricePreferencesQueryKeys } from "./price-preferences";

const REGIONS_QUERY_KEY = "regions" as const;
export const regionsQueryKeys = queryKeysFactory(REGIONS_QUERY_KEY);

export const useRegion = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.regions.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.regions.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: regionsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.regions.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRegions = (
  query?: InferClientInput<typeof sdk.admin.regions.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.regions.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.regions.query({ ...query }),
    queryKey: regionsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateRegion = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.regions.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.regions.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.regions.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.lists() });

      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateRegion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.regions.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.regions.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.regions.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.details() });

      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteRegion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.regions.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.regions.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
