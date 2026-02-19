import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { ClientError } from "@mercurjs/client"
import { client } from "../../lib/client"

const PRODUCTS_QUERY_KEY = "vendor_products" as const
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY)

type ImportProductsResponse = { summary: { created: number } }
type ExportProductsResponse = { url: string }

export const useImportProducts = (
  options?: UseMutationOptions<ImportProductsResponse, ClientError, File>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: any) => client.vendor.products.import.mutate({file, fetchOptions: {headers:{'Content-Type': 'multipart/form-data'}}}),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useExportProducts = (
  options?: UseMutationOptions<ExportProductsResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: async () =>
      client.vendor.products.export.mutate(),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
