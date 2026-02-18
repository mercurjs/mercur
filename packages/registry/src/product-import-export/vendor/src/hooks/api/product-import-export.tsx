import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import config from "virtual:mercur/config"

const backendUrl = config.backendUrl ?? "http://localhost:9000"

const PRODUCTS_QUERY_KEY = "vendor_products" as const
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY)

export const useImportProducts = (
  options?: UseMutationOptions<any, Error, File>
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
        throw new Error(err.message || "Import failed")
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
  options?: UseMutationOptions<{ url: string }, Error, void>
) => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${backendUrl}/vendor/products/export`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Export failed")
      }

      return response.json()
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
