import { AuthenticatedMedusaRequest, MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductCollectionDTO } from "@medusajs/types"

export const refetchCollection = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields,
    filters: { id },
  })

  return collection
}


export const wrapCollectionsWithProducts = async (collections: ProductCollectionDTO[], req: AuthenticatedMedusaRequest) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts } = await query.graph({
    entity: "product_seller",
    filters: {
      seller_id: req.auth_context.actor_id,
    },
    fields: ["product.*"],
  })

  collections.forEach(collection => {
    collection.products = sellerProducts.filter(({ product }) => product.collection_id === collection.id).map(({ product }) => product)
  })
}