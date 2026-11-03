import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * The index engine syncs asynchronously after writes. Poll until each product
 * is ingested with its current status and its product_seller restriction state,
 * so list assertions (including negative ones) run against a settled index.
 * Matches through index filters only: response fields are hydrated from the
 * database and would report a settled state the index does not have yet.
 */
export const waitForIndexedProducts = async (
  container: MedusaContainer,
  expected: {
    id: string
    status?: string
    title?: string
    restricted: boolean
  }[],
  { timeout = 15000, interval = 100 }: { timeout?: number; interval?: number } = {}
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const deadline = Date.now() + timeout

  const isSettled = async (entry: (typeof expected)[number]) => {
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
    return data.length === 1
  }

  while (true) {
    const settled = await Promise.all(expected.map(isSettled))
    if (settled.every(Boolean)) {
      return
    }
    if (Date.now() > deadline) {
      throw new Error(
        `Products [${expected.map((e) => e.id).join(", ")}] were not indexed within ${timeout}ms`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}
