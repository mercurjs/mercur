import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Upsert two addresses (Home + Office) onto every customer.
 *
 * Idempotent: addresses are keyed by `address_name`, so re-running updates the
 * existing Home/Office rows instead of creating duplicates.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/upsert-customer-addresses.ts
 */
const ADDRESSES = [
  {
    address_name: "Home",
    company: null,
    address_1: "ul. Słoneczna 14/7",
    address_2: null,
    city: "Wrocław",
    province: null,
    postal_code: "50-312",
    country_code: "pl",
  },
  {
    address_name: "Office",
    company: null,
    address_1: "ul. Słoneczna 15/17",
    address_2: null,
    city: "Wrocław",
    province: null,
    postal_code: "50-312",
    country_code: "pl",
  },
]

const PAGE_SIZE = 200

export default async function upsertCustomerAddresses({ container }: ExecArgs) {
  const customerModule = container.resolve(Modules.CUSTOMER)

  let offset = 0
  let processed = 0
  let created = 0
  let updated = 0

  for (;;) {
    const customers = await customerModule.listCustomers(
      {},
      { select: ["id"], take: PAGE_SIZE, skip: offset }
    )

    if (!customers.length) {
      break
    }

    for (const customer of customers) {
      const existing = await customerModule.listCustomerAddresses(
        { customer_id: customer.id },
        { select: ["id", "address_name"], take: null }
      )

      for (const address of ADDRESSES) {
        const match = existing.find(
          (a) => a.address_name === address.address_name
        )

        if (match) {
          await customerModule.updateCustomerAddresses(match.id, address)
          updated++
        } else {
          await customerModule.createCustomerAddresses({
            customer_id: customer.id,
            ...address,
          })
          created++
        }
      }

      processed++
    }

    offset += customers.length

    if (customers.length < PAGE_SIZE) {
      break
    }
  }

  console.log(
    `Upserted addresses for ${processed} customers (created ${created}, updated ${updated}).`
  )
}
