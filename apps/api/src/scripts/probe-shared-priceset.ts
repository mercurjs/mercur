import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Empirically probe the shared-PriceSet + `offer_id` PriceRule model.
 *
 * Hypothesis: one PriceSet per variant can hold rows for N sibling offers
 * (discriminated by an `offer_id` PriceRule), and a single calculatePrices
 * bulk call can resolve correct per-offer prices by passing offer_id
 * (scalar or array) in context.
 *
 * The script intentionally only uses the pricing module — no offers,
 * no order-group, no cart. We want to see exactly what the resolver
 * returns under each scenario.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/probe-shared-priceset.ts
 */
export default async function probeSharedPriceSet({ container }: ExecArgs) {
  const pricing = container.resolve(Modules.PRICING)

  console.log("\n=== Phase 1: create shared PriceSet for variant V1 ===\n")

  const [priceSet] = await pricing.createPriceSets([
    {
      prices: [
        // Offer A — base + two qty tiers
        { amount: 20, currency_code: "usd", rules: { offer_id: "off_A" } },
        {
          amount: 18,
          currency_code: "usd",
          min_quantity: 10,
          rules: { offer_id: "off_A" },
        },
        {
          amount: 15,
          currency_code: "usd",
          min_quantity: 50,
          rules: { offer_id: "off_A" },
        },
        // Offer B — base only
        { amount: 25, currency_code: "usd", rules: { offer_id: "off_B" } },
        // Offer C — base only
        { amount: 30, currency_code: "usd", rules: { offer_id: "off_C" } },
      ],
    },
  ])
  const priceSetId = priceSet.id
  console.log(
    `PriceSet ${priceSetId} created with 5 Price rows across offers A/B/C`
  )

  const runScenario = async (
    label: string,
    context: Record<string, unknown>
  ) => {
    let result: unknown
    try {
      result = await pricing.calculatePrices(
        { id: [priceSetId] },
        { context: context as Record<string, string | number> }
      )
    } catch (err) {
      result = `THREW: ${(err as Error).message}`
    }
    console.log(`\n--- ${label} ---`)
    console.log(`context: ${JSON.stringify(context)}`)
    console.log(`result : ${JSON.stringify(result, null, 2)}`)
  }

  let priceListId: string | undefined

  try {
    console.log("\n=== Phase 2: probe with NO PriceList active ===")

    await runScenario("A scalar, qty 1 — expect $20", {
      currency_code: "usd",
      offer_id: "off_A",
    })
    await runScenario("B scalar, qty 1 — expect $25", {
      currency_code: "usd",
      offer_id: "off_B",
    })
    await runScenario("C scalar, qty 1 — expect $30", {
      currency_code: "usd",
      offer_id: "off_C",
    })

    await runScenario(
      "[A,B,C] array, qty 1 — does Medusa accept array context?",
      { currency_code: "usd", offer_id: ["off_A", "off_B", "off_C"] }
    )

    await runScenario("A scalar, qty 10 — expect tier $18", {
      currency_code: "usd",
      offer_id: "off_A",
      quantity: 10,
    })
    await runScenario("A scalar, qty 50 — expect tier $15", {
      currency_code: "usd",
      offer_id: "off_A",
      quantity: 50,
    })
    await runScenario(
      "[A,B,C], qty 50 — tier of A vs base of B/C — what wins?",
      {
        currency_code: "usd",
        offer_id: ["off_A", "off_B", "off_C"],
        quantity: 50,
      }
    )
    await runScenario("no offer_id — empty rule context", {
      currency_code: "usd",
    })

    console.log("\n=== Phase 3: attach PriceList SALE for offer A ($12) ===")

    const [list] = await pricing.createPriceLists([
      {
        title: "Vendor A Sale",
        description: "Sale row scoped to offer A only",
        type: "sale" as never,
        status: "active" as never,
        prices: [
          {
            amount: 12,
            currency_code: "usd",
            price_set_id: priceSetId,
            rules: { offer_id: "off_A" },
          },
        ],
      },
    ])
    priceListId = list.id
    console.log(
      `PriceList ${priceListId} created with $12 sale row (rule offer_id=A)`
    )

    console.log("\n=== Phase 4: probe WITH PriceList active ===")

    await runScenario("A scalar, qty 1 — expect $12 (sale beats $20 base)", {
      currency_code: "usd",
      offer_id: "off_A",
    })
    await runScenario(
      "B scalar, qty 1 — BLEED CHECK: should be $25, not $12",
      { currency_code: "usd", offer_id: "off_B" }
    )
    await runScenario(
      "C scalar, qty 1 — BLEED CHECK: should be $30, not $12",
      { currency_code: "usd", offer_id: "off_C" }
    )

    await runScenario(
      "[A,B,C] array, qty 1 — what does the resolver pick?",
      { currency_code: "usd", offer_id: ["off_A", "off_B", "off_C"] }
    )

    await runScenario(
      "A scalar, qty 50 — tier $15 vs sale $12, expect $12",
      { currency_code: "usd", offer_id: "off_A", quantity: 50 }
    )
    await runScenario(
      "B scalar, qty 50 — should stay at $25 (no tier, no sale)",
      { currency_code: "usd", offer_id: "off_B", quantity: 50 }
    )
    await runScenario("[A,B,C], qty 50 — combined behaviour", {
      currency_code: "usd",
      offer_id: ["off_A", "off_B", "off_C"],
      quantity: 50,
    })

    console.log("\n=== Phase 5: list raw prices on the PriceSet ===")
    const rawPrices = await pricing.listPrices(
      { price_set_id: priceSetId },
      { relations: ["price_rules"] }
    )
    console.log(
      `Raw Price rows on ${priceSetId}: ${JSON.stringify(
        rawPrices.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency_code: p.currency_code,
          min_quantity: p.min_quantity,
          price_list_id: (p as { price_list_id?: string }).price_list_id,
          rules: p.price_rules?.map((r) => ({
            attribute: r.attribute,
            value: r.value,
          })),
        })),
        null,
        2
      )}`
    )
  } finally {
    console.log("\n=== Cleanup ===")
    if (priceListId) {
      await pricing.deletePriceLists([priceListId])
      console.log(`Deleted PriceList ${priceListId}`)
    }
    await pricing.deletePriceSets([priceSetId])
    console.log(`Deleted PriceSet ${priceSetId}`)
  }

  console.log("\nDone.\n")
}
