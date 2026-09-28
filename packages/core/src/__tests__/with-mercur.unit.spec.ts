jest.mock("../patches", () => ({
  assertPatchesDisabled: jest.fn(),
  disabledPatchesFromEnv: jest.fn(() => []),
  ensureMercurPatches: jest.fn(),
}))
jest.mock("../utils/disable-medusa-middlewares", () => ({
  disableMedusaMiddlewares: jest.fn(),
}))

import { withMercur } from "../with-mercur"

// Medusa's defineConfig registers rbac itself as `disable: true` when the flag
// is off, so only count entries that would actually load.
const rbacModules = (config: ReturnType<typeof withMercur>) =>
  Object.values(config.modules ?? {}).filter(
    (m) =>
      typeof m === "object" &&
      m?.resolve === "@medusajs/medusa/rbac" &&
      !("disable" in m && m.disable)
  )

describe("withMercur", () => {
  it("leaves the rbac flag and module out by default", () => {
    const config = withMercur()

    expect(config.featureFlags?.rbac).toBe(false)
    expect(rbacModules(config)).toHaveLength(0)
  })

  it("registers the rbac module when the flag is enabled", () => {
    const config = withMercur({ featureFlags: { rbac: true } })

    expect(config.featureFlags?.rbac).toBe(true)
    expect(rbacModules(config)).toHaveLength(1)
  })

  it("does not duplicate an rbac module the project already registers", () => {
    const config = withMercur({
      featureFlags: { rbac: true },
      modules: [{ resolve: "@medusajs/medusa/rbac" }],
    })

    expect(rbacModules(config)).toHaveLength(1)
  })
})
