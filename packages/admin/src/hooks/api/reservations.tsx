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
import { sdk } from "../../lib/client/index.ts";
import { queryClient } from "../../lib/query-client.ts";
import { queryKeysFactory } from "../../lib/query-key-factory.ts";
import {
  inventoryItemLevelsQueryKeys,
  inventoryItemsQueryKeys,
} from "./inventory.tsx";

const RESERVATION_ITEMS_QUERY_KEY = "reservation_items" as const;
export const reservationItemsQueryKeys = queryKeysFactory(
  RESERVATION_ITEMS_QUERY_KEY,
);

export const useReservationItem = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.reservations.$id.query>,
    "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.reservations.$id.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reservationItemsQueryKeys.detail(id),
    queryFn: async () =>
      sdk.vendor.reservations.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReservationItems = (
  query?: InferClientInput<typeof sdk.vendor.reservations.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.reservations.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.reservations.query({ ...query }),
    queryKey: reservationItemsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateReservationItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.reservations.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.reservations.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.reservations.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.details(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateReservationItem = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.reservations.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.reservations.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.reservations.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.details(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteReservationItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.reservations.$id.delete>,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.reservations.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.details(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
