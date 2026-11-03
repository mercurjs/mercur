import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { eventually } from "./eventually"

/**
 * The index syncs asynchronously after writes. Matches through index filters
 * only: response fields are hydrated from the database and would report a
 * state the index does not have yet.
 */
export const waitForIndexedProducts = async (
  container: MedusaContainer,
  expected: {
    id: string
    status?: string
    title?: string
    restricted: boolean
  }[]
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  await eventually(
    async () => {
      for (const entry of expected) {
        const { data } = await query.index({
          entity: "product",
          fields: ["id"],
          filters: {
            id: entry.id,
            ...(entry.status ? { status: entry.status } : {}),
            ...(entry.title ? { title: entry.title } : {}),
            product_seller: {
              id: entry.restricted ? { $ne: null } : { $eq: null },
            },
          },
        })
        if (data.length !== 1) {
          throw new Error(`Product ${entry.id} is not indexed yet`)
        }
      }
    },
    { timeout: 15000, interval: 100 }
  )
}
