import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const SETTLEMENTS_QUERY_KEY = "settlements" as const;
export const settlementsQueryKeys = queryKeysFactory(SETTLEMENTS_QUERY_KEY);

export type AdminSettlement = InferClientOutput<
  typeof sdk.admin.settlements.$id.query
>["settlement"];

export type AdminSettlementListItem = InferClientOutput<
  typeof sdk.admin.settlements.query
>["settlements"][number];

export const useSettlement = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.settlements.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.settlements.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.settlements.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.settlements.$id.query({ $id: id, ...query }),
    queryKey: settlementsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSettlements = (
  query?: InferClientInput<typeof sdk.admin.settlements.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.settlements.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.settlements.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.settlements.query({ ...query }),
    queryKey: settlementsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};
