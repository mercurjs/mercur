jest.mock("../patches", () => ({
  assertPatchesDisabled: jest.fn(),
  disabledPatchesFromEnv: jest.fn(() => []),
  ensureMercurPatches: jest.fn(),
}))
jest.mock("../utils/disable-medusa-middlewares", () => ({
  disableMedusaMiddlewares: jest.fn(),
}))

import { withMercur } from "../with-mercur"

const rbacModules = (config: ReturnType<typeof withMercur>) =>
  Object.values(config.modules ?? {}).filter(
    (m) =>
      typeof m === "object" &&
      m?.resolve === "@medusajs/medusa/rbac" &&
      !("disable" in m && m.disable)
  )

describe("withMercur", () => {
  it("never enables Medusa's rbac flag or module", () => {
    const config = withMercur()

    expect(config.featureFlags?.rbac).toBeFalsy()
    expect(rbacModules(config)).toHaveLength(0)
  })

  const paymentProviders = (config: ReturnType<typeof withMercur>) => {
    const paymentModules = Object.values(config.modules ?? {}).filter(
      (m) => typeof m === "object" && m?.resolve === "@medusajs/medusa/payment"
    )
    expect(paymentModules).toHaveLength(1)

    const options = (paymentModules[0] as { options?: unknown }).options as {
      providers: { resolve: string; id?: string }[]
    }
    return options.providers.map((p) => p.resolve)
  }

  it("registers the split-order payment provider", () => {
    expect(paymentProviders(withMercur())).toEqual([
      "@mercurjs/core/providers/payment-split-order",
    ])
  })

  it("keeps the project's payment providers", () => {
    const config = withMercur({
      modules: [
        {
          resolve: "@medusajs/medusa/payment",
          options: {
            providers: [{ resolve: "@medusajs/medusa/payment-stripe", id: "stripe" }],
          },
        },
      ],
    })

    expect(paymentProviders(config)).toEqual([
      "@medusajs/medusa/payment-stripe",
      "@mercurjs/core/providers/payment-split-order",
    ])
  })
})
