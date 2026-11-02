import { createTelemetrySender } from "../sender"

describe("createTelemetrySender", () => {
  it("posts a PostHog batch to the proxy with a placeholder key", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true })
    const sender = createTelemetrySender({
      env: { MERCUR_TELEMETRY_PROXY_URL: "http://proxy.test" },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await sender.capture([{ event: "instance_started", distinct_id: "inst", properties: { a: 1 } }])

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("http://proxy.test/batch")
    const body = JSON.parse(init.body)
    expect(body.api_key).toBe("mercur")
    expect(body.batch).toHaveLength(1)
    expect(body.batch[0].event).toBe("instance_started")
    expect(body.batch[0].properties).toEqual({ a: 1, $geoip_disable: true })
    expect(body.batch[0].timestamp).toBeDefined()
  })

  it("swallows network failures", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("boom"))
    const sender = createTelemetrySender({ env: {}, fetchImpl: fetchImpl as unknown as typeof fetch })

    await expect(
      sender.capture([{ event: "x", distinct_id: "y", properties: {} }]),
    ).resolves.toBeUndefined()
  })

  it("logs instead of sending in debug mode", async () => {
    const fetchImpl = jest.fn()
    const info = jest.fn()
    const sender = createTelemetrySender({
      env: { MERCUR_TELEMETRY_DEBUG: "true" },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      logger: { info } as never,
    })

    await sender.capture([{ event: "x", distinct_id: "y", properties: {} }])

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledTimes(1)
  })
})
