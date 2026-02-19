import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { ClientError } from "@mercurjs/client"
import { client, backendUrl } from "../../lib/client"

const PRODUCTS_QUERY_KEY = "vendor_products" as const
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY)

export const useImportProducts = (
  options?: UseMutationOptions<{ summary: { created: number } }, ClientError, File>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${backendUrl}/vendor/products/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new ClientError(
          err.message || "Import failed",
          response.statusText,
          response.status
        )
      }

      return response.json()
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useExportProducts = (
  options?: UseMutationOptions<{ url: string }, ClientError, void>
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
