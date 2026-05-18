import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client";
import { HttpTypes } from "@mercurjs/types";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { inventoryItemsQueryKeys } from "./inventory.tsx";

const PRODUCTS_QUERY_KEY = "products" as const;
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY);

const VARIANTS_QUERY_KEY = "product_variants" as const;
export const variantsQueryKeys = queryKeysFactory(VARIANTS_QUERY_KEY);

// --- Product queries ---

export const useProduct = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductResponse,
      ClientError,
      HttpTypes.AdminProductResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.products.$id.query({ $id: id, ...query }),
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProducts = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductListResponse,
      ClientError,
      HttpTypes.AdminProductListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.products.query({ ...query }),
    queryKey: productsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

// --- Product mutations ---

export const useCreateProduct = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    ClientError,
    Record<string, any>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.products.mutate(payload as any),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
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
    HttpTypes.AdminProductResponse,
    ClientError,
    Record<string, any>
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.mutate({ $id: id, ...payload }),
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
    HttpTypes.AdminProductDeleteResponse,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.admin.products.$id.delete({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchProducts = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.products.batch.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.products.batch.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.products.batch.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// --- Product action mutations ---

export const useConfirmProduct = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    ClientError,
    { internal_note?: string } | void
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.confirm.mutate({
        $id: id,
        ...(payload ?? {}),
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRejectProduct = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    ClientError,
    { message?: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.reject.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRequestProductChanges = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    ClientError,
    { message?: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.requestChanges.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantResponse,
      ClientError,
      HttpTypes.AdminProductVariantResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.products.$id.variants.$variantId.query({
        $id: productId,
        $variantId: variantId,
        ...query,
      }),
    queryKey: variantsQueryKeys.detail(variantId, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductVariants = (
  productId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantListResponse,
      ClientError,
      HttpTypes.AdminProductVariantListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.products.$id.variants.query({ $id: productId, ...query }),
    queryKey: variantsQueryKeys.list({ productId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<any, ClientError, any>,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.variants.mutate({ $id: productId, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
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
  options?: UseMutationOptions<any, ClientError, any>,
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.products.$id.variants.$variantId.mutate({
        $id: productId,
        $variantId: variantId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
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
  options?: UseMutationOptions<any, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.products.$id.variants.$variantId.delete({
        $id: productId,
        $variantId: variantId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
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
  options?: UseMutationOptions<any, ClientError, { variantId: string }>,
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      sdk.admin.products.$id.variants.$variantId.delete({
        $id: productId,
        $variantId: variantId,
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

// --- Product attribute sub-resource ---

const PRODUCT_ATTRIBUTES_QUERY_KEY = "product_product_attributes" as const;
export const scopedProductAttributesQueryKeys = queryKeysFactory(
  PRODUCT_ATTRIBUTES_QUERY_KEY,
);

export const useProductScopedAttributes = (
  productId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, ClientError, any, QueryKey>,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.products.$id.attributes.query({ $id: productId, ...query }),
    queryKey: scopedProductAttributesQueryKeys.list({ productId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAddAttributeToProduct = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    Record<string, any>
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.attributes.mutate({ $id: productId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: scopedProductAttributesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveAttributeFromProduct = (
  productId: string,
  attributeId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeDeleteResponse,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.products.$id.attributes.$attributeId.delete({
        $id: productId,
        $attributeId: attributeId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: scopedProductAttributesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// --- Attribute batch mutations ---

export const useBatchProductAttributes = (
  productId: string,
  options?: UseMutationOptions<
    any,
    ClientError,
    {
      create?: {
        attribute_id: string;
        attribute_value_ids?: string[];
        values?: string[];
      }[];
      delete?: string[];
    }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.products.$id.attributes.batch.mutate({
        $id: productId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: scopedProductAttributesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// --- Variant batch mutations ---

export const useUpdateProductVariantsBatch = (
  productId: string,
  options?: UseMutationOptions<any, ClientError, any>,
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.products.$id.variants.batch.mutate({
        $id: productId,
        update: payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
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
  options?: UseMutationOptions<any, ClientError, any>,
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.products.$id.variants.inventoryItems.batch.mutate({
        $id: productId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
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
