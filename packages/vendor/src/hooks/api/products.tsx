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
    InferClientOutput<typeof sdk.admin.products.$id.options.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.products.$id.options.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.options.mutate({ id: productId, ...payload }),
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
    InferClientOutput<typeof sdk.admin.products.$id.options.$optionId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.products.$id.options.$optionId.mutate>,
      "id" | "optionId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.options.$optionId.mutate({
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
    InferClientOutput<typeof sdk.admin.products.$id.options.$optionId.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.products.$id.options.$optionId.delete({
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
    InferClientInput<typeof sdk.admin.products.$id.variants.$variantId.query>,
    "id" | "variantId"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.products.$id.variants.$variantId.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.products.$id.variants.$variantId.query({
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
    InferClientInput<typeof sdk.admin.products.$id.variants.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.products.$id.variants.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.products.$id.variants.query({ id: productId, ...query }),
    queryKey: variantsQueryKeys.list({ productId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.$id.variants.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.products.$id.variants.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.mutate({ id: productId, ...payload }),
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
      typeof sdk.admin.products.$id.variants.$variantId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.products.$id.variants.$variantId.mutate
      >,
      "id" | "variantId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.$variantId.mutate({
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

export const useUpdateProductVariantsBatch = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.$id.variants.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.products.$id.variants.batch.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.batch.mutate({
        id: productId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariantsInventoryItemsBatch = (
  productId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.products.$id.variants.inventoryItems.batch.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.products.$id.variants.inventoryItems.batch.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.inventoryItems.batch.mutate({
        id: productId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });
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
      typeof sdk.admin.products.$id.variants.$variantId.delete
    >,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.products.$id.variants.$variantId.delete({
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
      typeof sdk.admin.products.$id.variants.$variantId.delete
    >,
    ClientError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      sdk.admin.products.$id.variants.$variantId.delete({
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
    InferClientInput<typeof sdk.admin.products.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.products.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.products.$id.query({ id, ...query }),
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProducts = (
  query?: InferClientInput<typeof sdk.admin.products.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.products.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.products.query({ ...query }),
    queryKey: productsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteProducts = (
  query?: Omit<
    InferClientInput<typeof sdk.admin.products.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.admin.products.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.admin.products.query>,
        number
      >,
      InferClientOutput<typeof sdk.admin.products.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => productsQueryKeys.list(params),
    queryFn: (params) => sdk.admin.products.query(params),
    query,
    options,
  });
};

export const useCreateProduct = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.products.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.products.mutate(payload),
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
    InferClientOutput<typeof sdk.admin.products.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.products.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.mutate({ id, ...payload }),
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
    InferClientOutput<typeof sdk.admin.products.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.products.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useExportProducts = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.export.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.products.export.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.products.export.mutate(payload),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useImportProducts = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.import.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.products.import.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.products.import.mutate(payload),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useConfirmImportProducts = (
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.products.imports.$transactionId.confirm.mutate
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (transactionId) =>
      sdk.admin.products.imports.$transactionId.confirm.mutate({
        transactionId,
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchImageVariants = (
  productId: string,
  imageId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.products.$id.images.$imageId.variants.batch.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.products.$id.images.$imageId.variants.batch.mutate
      >,
      "id" | "imageId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.images.$imageId.variants.batch.mutate({
        id: productId,
        imageId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchVariantImages = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.products.$id.variants.$variantId.images.batch.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.products.$id.variants.$variantId.images.batch.mutate
      >,
      "id" | "variantId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.$variantId.images.batch.mutate({
        id: productId,
        variantId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.list({ productId }),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });

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
