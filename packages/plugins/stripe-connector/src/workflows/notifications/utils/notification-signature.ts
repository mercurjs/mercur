import { createHmac } from "crypto"

export const NOTIFICATION_SIGNATURE_HEADER = "x-mercur-signature"

export const signNotification = (body: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`

export function notificationHeaders(body: string, secret: string | undefined): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(secret ? { [NOTIFICATION_SIGNATURE_HEADER]: signNotification(body, secret) } : {}),
  }
}

/**
 * The endpoint without its path, query or credentials. Chat webhook URLs
 * (Slack, Teams) carry their secret in the path.
 */
export function redactUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }
  try {
    return new URL(url).origin
  } catch {
    return "[invalid url]"
  }
}
