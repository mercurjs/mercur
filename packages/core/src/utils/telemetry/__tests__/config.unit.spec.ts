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

  it("lets the force flag override only the environment heuristics", () => {
    const force = { MERCUR_TELEMETRY_FORCE_ENABLED: "true" }

    expect(telemetryDisabledReason({ env: { NODE_ENV: "test", ...force } })).toBeNull()
    expect(telemetryDisabledReason({ env: { ...base, CI: "true", ...force } })).toBeNull()
    expect(
      telemetryDisabledReason({ env: { ...base, MEDUSA_WORKER_MODE: "worker", ...force } }),
    ).toBeNull()
    expect(telemetryDisabledReason({ env: { ...base, ...force }, workerMode: "worker" })).toBeNull()
  })

  it("keeps explicit opt-outs ahead of the force flag", () => {
    const force = { MERCUR_TELEMETRY_FORCE_ENABLED: "true" }

    expect(
      telemetryDisabledReason({ env: { ...base, MERCUR_DISABLE_TELEMETRY: "1", ...force } }),
    ).toBe("env")
    expect(telemetryDisabledReason({ env: { ...base, DO_NOT_TRACK: "1", ...force } })).toBe(
      "do_not_track",
    )
    expect(telemetryDisabledReason({ env: { ...base, ...force }, configEnabled: false })).toBe(
      "config",
    )
  })
})

describe("telemetryHost", () => {
  it("defaults to the Mercur proxy and strips trailing slashes", () => {
    expect(telemetryHost({})).toBe("https://telemetry.mercurjs.com")
    expect(telemetryHost({ MERCUR_TELEMETRY_PROXY_URL: "http://localhost:4000/" })).toBe("http://localhost:4000")
  })
})
