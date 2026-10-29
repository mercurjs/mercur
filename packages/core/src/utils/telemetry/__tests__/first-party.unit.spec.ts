import { providerIdLabel, splitFirstParty } from "../first-party"

describe("splitFirstParty", () => {
  it("names Mercur and Medusa packages and only counts everything else", () => {
    expect(
      splitFirstParty([
        "@mercurjs/core",
        "@mercurjs/stripe-connector-plugin",
        "@medusajs/medusa/payment",
        "my-company-plugin",
        "@acme/internal",
        undefined,
      ]),
    ).toEqual({
      first_party: ["@medusajs/medusa/payment", "@mercurjs/core", "@mercurjs/stripe-connector-plugin"],
      custom_count: 2,
    })
  })

  it("deduplicates first-party names", () => {
    expect(splitFirstParty(["@mercurjs/core", "@mercurjs/core"]).first_party).toEqual(["@mercurjs/core"])
  })
})

describe("providerIdLabel", () => {
  it("keeps first-party provider ids and hides custom ones", () => {
    expect(providerIdLabel("@mercurjs/stripe-connector-plugin/providers/payout-stripe-connect", "stripe")).toBe(
      "@mercurjs/stripe-connector-plugin/providers/payout-stripe-connect#stripe",
    )
    expect(providerIdLabel("./src/providers/acme-payouts", "acme")).toBe("custom")
    expect(providerIdLabel(undefined, "x")).toBeUndefined()
  })
})
