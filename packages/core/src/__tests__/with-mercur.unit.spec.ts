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
})
