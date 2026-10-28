import { VendorCreateOnboarding } from "../validators"

describe("VendorCreateOnboarding", () => {
  it("drops redirect urls so sellers can't point onboarding at their own domain", () => {
    const parsed = VendorCreateOnboarding.parse({
      data: { refresh_url: "https://evil.test", return_url: "https://evil.test", country: "DE" },
    })

    expect(parsed.data).toEqual({ country: "DE" })
  })
})
