import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  useMutation,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { inventoryItemsQueryKeys } from "./inventory.tsx";
import { useInfiniteList } from "../use-infinite-list.tsx";

const PRODUCTS_QUERY_KEY = "products" as const;
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY);

const VARIANTS_QUERY_KEY = "product_variants" as const;
export const variantsQueryKeys = queryKeysFactory(VARIANTS_QUERY_KEY);

const OPTIONS_QUERY_KEY = "product_options" as const;
export const optionsQueryKeys = queryKeysFactory(OPTIONS_QUERY_KEY);

export const useCreateProductOption = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.options.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.products.$id.options.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.options.mutate({ id: productId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.options.$optionId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.products.$id.options.$optionId.mutate>,
      "id" | "optionId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.options.$optionId.mutate({
        id: productId,
        optionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.options.$optionId.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.products.$id.options.$optionId.delete({
        id: productId,
        optionId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.variants.$variantId>,
    "id" | "variantId"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.$id.variants.$variantId>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.products.$id.variants.$variantId.query({
        id: productId,
        variantId,
        ...query,
      }),
    queryKey: variantsQueryKeys.detail(variantId, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductVariants = (
  productId: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.variants.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.$id.variants.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => {
      if (!productId) {
        throw new Error("productId is required for useProductVariants")
      }
      return fetchQuery(`/vendor/products/${productId}/variants`, {
        method: "GET",
        query: { ...query },
      })
    },
    queryKey: variantsQueryKeys.list({ productId, ...query }),
    ...options,
    enabled: !!productId && (options?.enabled !== undefined ? options.enabled : true),
  });

  return { ...data, ...rest };
};

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.variants.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.products.$id.variants.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.variants.mutate({ id: productId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.products.$id.variants.$variantId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.products.$id.variants.$variantId.mutate
      >,
      "id" | "variantId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.variants.$variantId.mutate({
        id: productId,
        variantId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.products.$id.variants.$variantId.delete
    >,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.products.$id.variants.$variantId.delete({
        id: productId,
        variantId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariantLazy = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.products.$id.variants.$variantId.delete
    >,
    ClientError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      sdk.vendor.products.$id.variants.$variantId.delete({
        id: productId,
        variantId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variables.variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProduct = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.products.$id.query({ id, ...query }),
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProducts = (
  query?: InferClientInput<typeof sdk.vendor.products.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.products.query({ ...query }),
    queryKey: productsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteProducts = (
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.vendor.products.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.vendor.products.query>,
        number
      >,
      InferClientOutput<typeof sdk.vendor.products.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => productsQueryKeys.list(params),
    queryFn: (params) => sdk.vendor.products.query(params),
    query,
    options,
  });
};

export const useCreateProduct = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.products.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.products.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      // if `manage_inventory` is true on created variants that will create inventory items automatically
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProduct = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.products.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.mutate({ id, ...payload }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProduct = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.products.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.products.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

type ProductAttributesResponse = {
  attributes: any[]
}

const productAttributesQueryKey = (id: string) => [
  "product-attributes",
  id,
]

export const useProductAttributes = (id: string) => {
  const { data, ...rest } = useQuery<ProductAttributesResponse>({
    queryFn: () =>
      fetchQuery(`/vendor/products/${id}/applicable-attributes`, {
        method: "GET",
        query: { fields: "+is_required" },
      }),
    queryKey: productAttributesQueryKey(id),
  })

  return { ...data, ...rest }
}

export const useBulkDeleteProducts = (
  options?: UseMutationOptions<any[], ClientError, string[]>
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
