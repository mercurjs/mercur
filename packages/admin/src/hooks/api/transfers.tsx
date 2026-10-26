import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const TRANSFERS_QUERY_KEY = "transfers" as const;
export const transfersQueryKeys = queryKeysFactory(TRANSFERS_QUERY_KEY);

export type AdminTransfer = InferClientOutput<
  typeof sdk.admin.transfers.$id.query
>["transfer"] & {
  account?: {
    id: string;
    provider_account_id: string | null;
    seller?: { id: string; name: string; handle: string } | null;
  } | null;
};

type TransferResponse = { transfer: AdminTransfer };

export const useTransfer = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.transfers.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<TransferResponse, ClientError, TransferResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.transfers.$id.query({
        $id: id,
        ...query,
      }) as Promise<TransferResponse>,
    queryKey: transfersQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

type TransferListResponse = Omit<
  InferClientOutput<typeof sdk.admin.transfers.query>,
  "transfers"
> & { transfers: AdminTransfer[] };

export const useTransfers = (
  query?: InferClientInput<typeof sdk.admin.transfers.query>,
  options?: Omit<
    UseQueryOptions<
      TransferListResponse,
      ClientError,
      TransferListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.transfers.query({ ...query }) as Promise<TransferListResponse>,
    queryKey: transfersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRetryTransfer = (
  id: string,
  options?: UseMutationOptions<TransferResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.transfers.$id.retry.mutate({
        $id: id,
      }) as Promise<TransferResponse>,
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transfersQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: transfersQueryKeys.detail(id),
        }),
      ]);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
