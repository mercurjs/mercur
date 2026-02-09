import { HttpTypes } from "@medusajs/types"
import { defer, LoaderFunction } from "react-router-dom"
import { sdk } from "../../../lib/client"

async function getProductStockData(id: string) {
  const CHUNK_SIZE = 20
  let offset = 0
  let totalCount = 0

  let allVariants: HttpTypes.AdminProductVariant[] = []

  do {
    const { variants: chunk, count } = await sdk.admin.products.$id.variants.query(
      {
        id,
        offset,
        limit: CHUNK_SIZE,
        fields:
          "id,title,sku,inventory_items,inventory_items.*,inventory_items.inventory,inventory_items.inventory.id,inventory_items.inventory.title,inventory_items.inventory.sku,*inventory_items.inventory.location_levels,product.thumbnail",
      }
    )

    allVariants = [...allVariants, ...chunk]
    totalCount = count
    offset += CHUNK_SIZE
  } while (allVariants.length < totalCount)

  const { stock_locations } = await sdk.admin.stockLocations.query({
    limit: 9999,
    fields: "id,name",
  })

  return {
    variants: allVariants,
    locations: stock_locations,
  }
}

export const productStockLoader: LoaderFunction = async ({
  params,
}) => {
  const id = params.id!

  const dataPromise = getProductStockData(id)

  return defer({
    data: dataPromise,
  })
}
