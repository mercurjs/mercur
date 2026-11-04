import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { productChangeQueryKeys } from "./products"

export const useProductChanges = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productChanges.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productChanges.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.productChanges.query({
        ...(query as InferClientInput<typeof sdk.admin.productChanges.query>),
      }),
    queryKey: productChangeQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}
