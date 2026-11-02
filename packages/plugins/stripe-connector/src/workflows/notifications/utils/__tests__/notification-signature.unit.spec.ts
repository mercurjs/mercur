import { createHmac } from "crypto"

import { NOTIFICATION_SIGNATURE_HEADER, notificationHeaders, redactUrl } from "../notification-signature"

describe("operator notifications", () => {
  it("signs the body with HMAC-SHA256 when a secret is configured", () => {
    const body = JSON.stringify({ type: "test", payload: {} })
    const headers = notificationHeaders(body, "s3cret")
    const expected = createHmac("sha256", "s3cret").update(body).digest("hex")
    expect(headers[NOTIFICATION_SIGNATURE_HEADER]).toBe(`sha256=${expected}`)
    expect(headers["content-type"]).toBe("application/json")
  })

  it("sends no signature without a secret", () => {
    expect(notificationHeaders("{}", undefined)).toEqual({ "content-type": "application/json" })
  })

  it("redacts the webhook secret in the path, query and credentials", () => {
    expect(redactUrl("https://hooks.slack.com/services/T000/B000/XXXX")).toBe("https://hooks.slack.com")
    expect(redactUrl("https://user:pass@ops.example.com:8443/hook?token=abc")).toBe("https://ops.example.com:8443")
    expect(redactUrl("not a url")).toBe("[invalid url]")
    expect(redactUrl(undefined)).toBeNull()
  })
})
