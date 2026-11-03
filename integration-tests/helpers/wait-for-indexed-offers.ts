import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { eventually } from "./eventually"

// The index syncs asynchronously after writes.
export const waitForIndexedOffers = async (
  container: MedusaContainer,
  expected: { id: string; visible: boolean }[]
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  await eventually(
    async () => {
      for (const entry of expected) {
        const { data } = await query.index({
          entity: "offer",
          fields: ["id"],
          filters: {
            id: entry.id,
            ...(entry.visible
              ? {
                  seller: { status: "open" },
                  product: { status: "published" },
                }
              : {}),
          },
        })
        if (data.length !== 1) {
          throw new Error(`Offer ${entry.id} is not indexed yet`)
        }
      }
    },
    { timeout: 15000, interval: 100 }
  )
}
