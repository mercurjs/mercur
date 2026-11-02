import { telemetryDisabledReason, telemetryHost } from "../config"

const base: NodeJS.ProcessEnv = { NODE_ENV: "production" }

describe("telemetryDisabledReason", () => {
  it("is enabled by default", () => {
    expect(telemetryDisabledReason({ env: base })).toBeNull()
  })

  it.each([
    [{ MERCUR_DISABLE_TELEMETRY: "true" }, "env"],
    [{ MERCUR_DISABLE_TELEMETRY: "1" }, "env"],
    [{ DO_NOT_TRACK: "1" }, "do_not_track"],
    [{ CI: "true" }, "ci"],
    [{ GITHUB_ACTIONS: "true" }, "ci"],
    [{ NODE_ENV: "test" }, "test"],
    [{ MEDUSA_WORKER_MODE: "worker" }, "worker"],
  ])("returns the reason for %o", (env, reason) => {
    expect(telemetryDisabledReason({ env: { ...base, ...env } })).toBe(reason)
  })

  it("honours the config key and the worker mode argument", () => {
    expect(telemetryDisabledReason({ env: base, configEnabled: false })).toBe("config")
    expect(telemetryDisabledReason({ env: base, workerMode: "worker" })).toBe("worker")
    expect(telemetryDisabledReason({ env: base, workerMode: "server" })).toBeNull()
  })

  it("lets an explicit opt-out win over the test override", () => {
    expect(
      telemetryDisabledReason({ env: { NODE_ENV: "test", MERCUR_TELEMETRY_FORCE_ENABLED: "true" } }),
    ).toBeNull()
  })
})

describe("telemetryHost", () => {
  it("defaults to the Mercur proxy and strips trailing slashes", () => {
    expect(telemetryHost({})).toBe("https://telemetry.mercurjs.com")
    expect(telemetryHost({ MERCUR_TELEMETRY_PROXY_URL: "http://localhost:4000/" })).toBe("http://localhost:4000")
  })
})
