import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const CURRENCIES_QUERY_KEY = "currencies" as const;
const currenciesQueryKeys = queryKeysFactory(CURRENCIES_QUERY_KEY);

export const useCurrencies = (
  query?: InferClientInput<typeof sdk.vendor.currencies.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.currencies.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.currencies.query({ ...query }),
    queryKey: currenciesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCurrency = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.currencies.$code.query>,
    "code"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.currencies.$code.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: currenciesQueryKeys.detail(id),
    queryFn: async () =>
      sdk.vendor.currencies.$code.query({ code: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};
