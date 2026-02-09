import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const LOCALES_QUERY_KEY = "locales" as const
const localesQueryKeys = queryKeysFactory(LOCALES_QUERY_KEY)

export const useLocales = (
  query?: InferClientInput<typeof sdk.admin.locales.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.locales.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.locales.query({ ...query }),
    queryKey: localesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useLocale = (
  code: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.locales.$code.query>,
    "code"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.locales.$code.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: localesQueryKeys.detail(code),
    queryFn: async () => sdk.admin.locales.$code.query({ code, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}
