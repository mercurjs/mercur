import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ProductChangeActionType, ProductStatus } from "@mercurjs/types"

import type { ProductVisibility } from "../../utils/list-products"

export const getSellerOwnedProductIds = async (
  scope: MedusaContainer,
  sellerId: string,
  productIds?: string[]
): Promise<string[]> => {
  if (productIds && !productIds.length) {
    return []
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: actions } = await query.graph({
    entity: "product_change_action",
    fields: ["product_id"],
    filters: {
      action: ProductChangeActionType.PRODUCT_ADD,
      product_change: { created_by: sellerId },
      ...(productIds ? { product_id: productIds } : {}),
    },
  })

  return actions.map((action) => action.product_id)
}

/**
 * Product ids that are restricted (have at least one `product_seller` row) but
 * NOT assigned to this seller — i.e. restricted to other sellers, so they must
 * be hidden from this seller's product list. Pass `productIds` to scope the
 * check to a known set; without it only the rows of other sellers are read.
 */
export const getProductIdsRestrictedFromSeller = async (
  scope: MedusaContainer,
  sellerId: string,
  productIds?: string[]
): Promise<string[]> => {
  if (productIds && !productIds.length) {
    return []
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const productScope = productIds ? { product_id: productIds } : {}

  const [{ data: otherSellerLinks }, { data: ownLinks }] = await promiseAll([
    query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: { $ne: sellerId }, ...productScope },
    }),
    query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: sellerId, ...productScope },
    }),
  ])

  const assigned = new Set(
    (ownLinks as { product_id: string | null }[]).map((link) => link.product_id)
  )
  const restricted = new Set<string>()
  for (const link of otherSellerLinks as { product_id: string | null }[]) {
    if (link.product_id && !assigned.has(link.product_id)) {
      restricted.add(link.product_id)
    }
  }

  return Array.from(restricted)
}

export const getSellerProductVisibility = async (
  scope: MedusaContainer,
  sellerId: string
): Promise<ProductVisibility> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const [ownProductIds, { data: allowlistLinks }] = await promiseAll([
    getSellerOwnedProductIds(scope, sellerId),
    query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: sellerId },
    }),
  ])

  const ownSubmissions = ownProductIds.length
    ? [
        {
          id: ownProductIds,
          status: { $in: [ProductStatus.DRAFT, ProductStatus.PROPOSED] },
        },
      ]
    : []
  const allowlistedIds = (allowlistLinks as { product_id: string | null }[])
    .map((link) => link.product_id)
    .filter((id): id is string => !!id)

  return {
    // A bare `null` compiles to `= NULL` in the index query builder, hence `$eq`.
    index: {
      $or: [
        ...ownSubmissions,
        {
          status: ProductStatus.PUBLISHED,
          product_seller: { id: { $eq: null } },
        },
        ...(allowlistedIds.length
          ? [{ status: ProductStatus.PUBLISHED, id: allowlistedIds }]
          : []),
      ],
    },
    graph: async () => {
      const restrictedFromSellerIds = await getProductIdsRestrictedFromSeller(
        scope,
        sellerId
      )
      return {
        $or: [
          ...ownSubmissions,
          {
            status: ProductStatus.PUBLISHED,
            id: { $nin: restrictedFromSellerIds },
          },
        ],
      }
    },
  }
}

export const isProductVisibleToSeller = async (
  scope: MedusaContainer,
  sellerId: string,
  productId: string
): Promise<boolean> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const [ownProductIds, restrictedFromSellerIds, { data: [product] }] =
    await promiseAll([
      getSellerOwnedProductIds(scope, sellerId, [productId]),
      getProductIdsRestrictedFromSeller(scope, sellerId, [productId]),
      query.graph({
        entity: "product",
        fields: ["id", "status"],
        filters: { id: productId },
      }),
    ])

  if (!product) {
    return false
  }

  return (
    ownProductIds.includes(productId) ||
    (product.status === ProductStatus.PUBLISHED &&
      !restrictedFromSellerIds.includes(productId))
  )
}

export const ensureSellerOwnsProduct = async (
  scope: MedusaContainer,
  sellerId: string,
  productIds: string[]
): Promise<void> => {
  if (!productIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  // A seller may manage a product it is assigned to (product_seller eligibility)
  // OR a product it created (master-product authoring).
  const { data } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: {
      seller_id: sellerId,
      product_id: productIds,
    },
  })

  const ownedProductIds = new Set<string | null>(
    data.map(({ product_id }) => product_id)
  )
  for (const id of await getSellerOwnedProductIds(scope, sellerId, productIds)) {
    ownedProductIds.add(id)
  }
  const missingProductId = productIds.find((id) => !ownedProductIds.has(id))

  if (missingProductId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${missingProductId} was not found`
    )
  }
}
