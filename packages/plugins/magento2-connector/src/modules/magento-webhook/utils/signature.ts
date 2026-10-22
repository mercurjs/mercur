import { createHmac, timingSafeEqual } from "node:crypto"

export const signWebhookBody = (body: string, secret: string): string =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`

export const verifyWebhookSignature = (
  body: string,
  secret: string,
  signature: string
): boolean => {
  const expected = Buffer.from(signWebhookBody(body, secret))
  const received = Buffer.from(signature)

  return expected.length === received.length && timingSafeEqual(expected, received)
}
