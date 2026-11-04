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

type ChangeRequestCandidate = {
  id: string
  product_id: string
  message: string | null
  requested_at: string | Date
}

/**
 * Attaches the operator's open change request to each product. A request
 * stays open while it is the most recent change on the product: the next
 * change, whoever writes it, closes it.
 */
export const enrichProductChangeRequests = async (
  scope: MedusaContainer,
  products: Array<{ id: string; change_request?: unknown }>
): Promise<void> => {
  for (const product of products) {
    product.change_request = null
  }
  if (!products.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const productIds = products.map((product) => product.id)

  const { data: requestActions } = await query.graph({
    entity: "product_change_action",
    fields: [
      "product_id",
      "product_change.id",
      "product_change.external_note",
      "product_change.created_at",
    ],
    filters: {
      action: ProductChangeActionType.CHANGE_REQUESTED,
      product_id: productIds,
    },
  })

  const candidates = new Map<string, ChangeRequestCandidate>()
  for (const action of requestActions as Array<{
    product_id: string
    product_change?: {
      id: string
      external_note: string | null
      created_at: string | Date
    } | null
  }>) {
    const change = action.product_change
    if (!change) {
      continue
    }
    const current = candidates.get(action.product_id)
    if (
      !current ||
      new Date(change.created_at) > new Date(current.requested_at)
    ) {
      candidates.set(action.product_id, {
        id: change.id,
        product_id: action.product_id,
        message: change.external_note,
        requested_at: change.created_at,
      })
    }
  }

  if (!candidates.size) {
    return
  }

  const earliest = Array.from(candidates.values()).reduce(
    (min, c) => (new Date(c.requested_at) < min ? new Date(c.requested_at) : min),
    new Date(8640000000000000)
  )

  const { data: laterChanges } = await query.graph({
    entity: "product_change",
    fields: ["product_id", "created_at"],
    filters: {
      product_id: Array.from(candidates.keys()),
      created_at: { $gt: earliest },
    },
  })

  for (const change of laterChanges as Array<{
    product_id: string
    created_at: string | Date
  }>) {
    const candidate = candidates.get(change.product_id)
    if (
      candidate &&
      new Date(change.created_at) > new Date(candidate.requested_at)
    ) {
      candidates.delete(change.product_id)
    }
  }

  for (const product of products) {
    const candidate = candidates.get(product.id)
    if (candidate) {
      product.change_request = {
        id: candidate.id,
        message: candidate.message,
        requested_at: candidate.requested_at,
      }
    }
  }
}
