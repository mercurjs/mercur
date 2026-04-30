import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { ProductChangeDTO } from "@mercurjs/types";
import {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  useMutation,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { inventoryItemsQueryKeys } from "./inventory.tsx";
import { productAttributesQueryKeys } from "./product-attributes.tsx";
import { useInfiniteList } from "../use-infinite-list.tsx";

const PRODUCTS_QUERY_KEY = "products" as const;
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY);

const VARIANTS_QUERY_KEY = "product_variants" as const;
export const variantsQueryKeys = queryKeysFactory(VARIANTS_QUERY_KEY);

const PRODUCT_CHANGE_QUERY_KEY = "product_change" as const;
export const productChangeQueryKeys = queryKeysFactory(
  PRODUCT_CHANGE_QUERY_KEY
);

// All vendor staging endpoints reply 202 with this envelope.
type ProductChangeResponse = { product_change: ProductChangeDTO };

// --- Product queries ---

export const useProduct = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.query>,
    "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.products.$id.query({ $id: id, ...query }),
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

/**
 * Reads the active pending `ProductChange` for a product. Returns 404 when
 * none exists — pair with `enabled` or `useQuery` retry config to control
 * polling.
 */
export const useProductChange = (
  productId: string,
  options?: Omit<
    UseQueryOptions<ProductChangeResponse, ClientError, ProductChangeResponse>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.products.$id.change.query({ $id: productId }) as Promise<
        ProductChangeResponse
      >,
    queryKey: productChangeQueryKeys.detail(productId),
    ...options,
  });

  return { ...data, ...rest };
};

// --- Product mutations (all stage a ProductChange) ---

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
      // Variants created with `manage_inventory: true` create inventory items.
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Stages an `UPDATE` action on the product via
 * `productEditUpdateFieldsWorkflow`. Returns the created `ProductChange`;
 * the product itself is mutated only after operator confirms.
 */
export const useUpdateProduct = (
  id: string,
  options?: UseMutationOptions<
    ProductChangeResponse,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.products.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.mutate({
        $id: id,
        ...payload,
      }) as Promise<ProductChangeResponse>,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(id),
      });
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Stages a `PRODUCT_DELETE` action via `productEditDeleteProductWorkflow`.
 * Returns the created `ProductChange`; the product is soft-deleted only
 * after operator confirms.
 */
export const useDeleteProduct = (
  id: string,
  options?: UseMutationOptions<ProductChangeResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.products.$id.delete({ $id: id }) as Promise<
        ProductChangeResponse
      >,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// --- Variant queries ---

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.variants.$variantId.query>,
    "$id" | "$variantId"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<
      typeof sdk.vendor.products.$id.variants.$variantId.query
    >
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.products.$id.variants.$variantId.query({
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
  query?: Omit<
    InferClientInput<typeof sdk.vendor.products.$id.variants.query>,
    "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.products.$id.variants.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.products.$id.variants.query({ $id: productId, ...query }),
    queryKey: variantsQueryKeys.list({ productId, ...query }),
    ...options,
    enabled:
      !!productId && (options?.enabled !== undefined ? options.enabled : true),
  });

  return { ...data, ...rest };
};

// --- Variant mutations (all stage a ProductChange) ---

/**
 * Stages a `VARIANT_ADD` action via `productEditAddVariantWorkflow`.
 */
export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<
    ProductChangeResponse,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.products.$id.variants.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.variants.mutate({
        $id: productId,
        ...payload,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Stages a `VARIANT_UPDATE` action via `productEditUpdateVariantWorkflow`.
 */
export const useUpdateProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<
    ProductChangeResponse,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.products.$id.variants.$variantId.mutate
      >,
      "$id" | "$variantId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.variants.$variantId.mutate({
        $id: productId,
        $variantId: variantId,
        ...payload,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Stages a `VARIANT_REMOVE` action via `productEditRemoveVariantWorkflow`.
 */
export const useDeleteVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<ProductChangeResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.products.$id.variants.$variantId.delete({
        $id: productId,
        $variantId: variantId,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Same as {@link useDeleteVariant}, but the variant id is supplied at call
 * time. Useful for row-level delete buttons in tables where the variant id
 * isn't known when the hook is registered.
 */
export const useDeleteVariantLazy = (
  productId: string,
  options?: UseMutationOptions<
    ProductChangeResponse,
    ClientError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      sdk.vendor.products.$id.variants.$variantId.delete({
        $id: productId,
        $variantId: variantId,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
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

// --- Product attribute mutations (all stage a ProductChange) ---

/**
 * Stages an `ATTRIBUTE_ADD` action via `productEditAddAttributeWorkflow`.
 * Body must reference an existing attribute by id; `attribute_value_ids`
 * picks pre-existing values, `values` upserts by name.
 */
export const useAddProductAttribute = (
  productId: string,
  options?: UseMutationOptions<
    ProductChangeResponse,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.products.$id.attributes.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.products.$id.attributes.mutate({
        $id: productId,
        ...payload,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Stages an `ATTRIBUTE_REMOVE` action via
 * `productEditRemoveAttributeWorkflow`.
 */
export const useRemoveProductAttribute = (
  productId: string,
  attributeId: string,
  options?: UseMutationOptions<ProductChangeResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.products.$id.attributes.$attributeId.delete({
        $id: productId,
        $attributeId: attributeId,
      }) as Promise<ProductChangeResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productChangeQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
