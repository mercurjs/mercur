import { version } from "../../package.json"

const FEEDBACK_URL = "https://telemetry.mercurjs.com/feedback"

export const submitFeedback = async (message: string) => {
  const response = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      surface: "vendor",
      mercur_version: version,
      path: window.location.pathname,
    }),
  })

  if (!response.ok) {
    throw new Error(`Feedback request failed with ${response.status}`)
  }
}
