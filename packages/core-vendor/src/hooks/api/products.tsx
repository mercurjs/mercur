import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import { QueryKey, useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';



import { fetchQuery, importProductsQuery, sdk } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { ExtendedAdminProductListResponse, ExtendedAdminProductResponse, ExtendedAdminProductVariant, ProductAttributesResponse } from '../../types/products';
import productsImagesFormatter from '../../utils/products-images-formatter';
import { inventoryItemsQueryKeys } from './inventory.tsx';


const PRODUCTS_QUERY_KEY = "products" as const
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY)

const VARIANTS_QUERY_KEY = "product_variants" as const
export const variantsQueryKeys = queryKeysFactory(VARIANTS_QUERY_KEY)

const OPTIONS_QUERY_KEY = "product_options" as const
export const optionsQueryKeys = queryKeysFactory(OPTIONS_QUERY_KEY)

const productAttributesQueryKey = (productId: string) => [
  "product",
  productId,
  "product-attributes",
]

export const useCreateProductOption = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateProductOption) =>
      fetchQuery(`/vendor/products/${productId}/options`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateProductOption) =>
      fetchQuery(`/vendor/products/${productId}/options/${optionId}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/products/${productId}/options/${optionId}`, {
        method: "DELETE",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantResponse,
      FetchError,
      HttpTypes.AdminProductVariantResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const { product } = await fetchQuery(`/vendor/products/${productId}`, {
        method: "GET",
        query: {
          fields:
            "*variants,*variants.inventory,*variants.inventory.location_levels",
        },
      })

      const variant = product.variants.find(
        ({ id }: { id: string }) => id === variantId
      )

      return { variant }
    },
    queryKey: variantsQueryKeys.detail(variantId, query),
    ...options,
  })

  return { ...data, ...rest }
}

export type ProductVariantsListResponse = {
  variants: ExtendedAdminProductVariant[]
  count: number
  offset: number
  limit: number
}

export const useProductVariants = (
  productId: string,
  query?: Record<string, string | number | boolean | string[] | object | undefined>,
  options?: Omit<
    UseQueryOptions<
      ProductVariantsListResponse,
      FetchError,
      ProductVariantsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      return await fetchQuery(`/vendor/products/${productId}/variants`, {
        method: 'GET',
        query: query as Record<string, string | number | object>
      });
    },
    queryKey: variantsQueryKeys.list({
      productId,
      ...query,
    }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateProductVariant) =>
      fetchQuery(`/vendor/products/${productId}/variants`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (body: HttpTypes.AdminUpdateProductVariant) =>
      fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
        method: "POST",
        body,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// TODO: Change this to use endpoint that updates multiple variants at once
export const useUpdateProductVariantsBatch = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (variants: Array<{ id: string; [key: string]: any }>) => {
      const promises = variants.map((variant) => {
        const { id, ...updateData } = variant
        return fetchQuery(`/vendor/products/${productId}/variants/${id}`, {
          method: "POST",
          body: updateData,
        })
      })

      return Promise.all(promises)
    },
    onSuccess: (data: any, variables: any, context: any) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useProductVariantsInventoryItemsBatch = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchProductVariantInventoryItemResponse,
    FetchError,
    HttpTypes.AdminBatchProductVariantInventoryItemRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.product.batchVariantInventoryItems(productId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteVariantLazy = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductVariantDeleteResponse,
    FetchError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variables.variantId),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useProductAttributes = (id: string) => {
  const { data, ...rest } = useQuery<ProductAttributesResponse>({
    queryFn: () =>
      fetchQuery(`/vendor/products/${id}/applicable-attributes`, {
        method: "GET",
        query: { fields: "+is_required" }
      }),
    queryKey: productAttributesQueryKey(id),
  })

  return { ...data, ...rest }
}

export const useProduct = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      ExtendedAdminProductResponse,
      FetchError,
      ExtendedAdminProductResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/products/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      })

      return {
        ...response,
        product: productsImagesFormatter(response.product),
      }
    },
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  })

  return {
    ...data,
    ...rest,
  }
}

export const useProducts = (
  query?: HttpTypes.AdminProductListParams & { tag_id?: string | string[] },
  options?: Omit<
    UseQueryOptions<
      ExtendedAdminProductListResponse,
      FetchError,
      ExtendedAdminProductListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => 
     fetchQuery("/vendor/products", {
        method: "GET",
        query: query as Record<string, string | number>,
      }),
    queryKey: productsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProduct = (
  options?: UseMutationOptions<HttpTypes.AdminProductResponse, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload) =>
      await fetchQuery("/vendor/products", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProduct = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    FetchError,
    HttpTypes.AdminUpdateProduct & { additional_data?: { values: Record<string, string>[] } }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      return fetchQuery(`/vendor/products/${id}`, {
        method: "POST",
        body: {
          ...payload,
        },
      })
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      })
      await queryClient.invalidateQueries({
        queryKey: productAttributesQueryKey(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProduct = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBulkDeleteProducts = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductDeleteResponse[],
    FetchError,
    string[]
  >
) => {
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const deletePromises = productIds.map((id) =>
        fetchQuery(`/vendor/products/${id}`, {
          method: "DELETE",
        })
      )
      return Promise.all(deletePromises)
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      })

      variables.forEach((id: string) => {
        queryClient.invalidateQueries({
          queryKey: productsQueryKeys.detail(id),
        })
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useExportProducts = (
  query?: HttpTypes.AdminProductListParams,
  options?: UseMutationOptions<
    HttpTypes.AdminExportProductResponse & { url: string },
    FetchError,
    HttpTypes.AdminExportProductRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/products/export", {
        method: "POST",
        body: payload,
        query: query as { [key: string]: string },
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useImportProducts = (
  options?: UseMutationOptions<
    HttpTypes.AdminImportProductResponse,
    FetchError,
    HttpTypes.AdminImportProductRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) => importProductsQuery(payload.file),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useConfirmImportProducts = (
  options?: UseMutationOptions<{}, FetchError, string>
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.product.confirmImport(payload),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
