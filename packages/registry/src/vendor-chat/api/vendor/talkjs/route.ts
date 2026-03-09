import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const { TALKJS_APP_ID, TALKJS_SECRET_API_KEY } = process.env

  try {
    const response = await fetch(
      `https://api.talkjs.com/v1/${TALKJS_APP_ID}/users/${req.auth_context.actor_id}/conversations`,
      {
        headers: {
          Authorization: `Bearer ${TALKJS_SECRET_API_KEY}`,
        },
      }
    )

    if (![200, 404].includes(response.status)) {
      throw new Error(`Response ${response.status}`)
    }

    const { data } = await response.json()
    res.json({ conversations: response.status === 200 ? data : [] })
  } catch (e: any) {
    logger.error(`TalkJS error: ${e.message}`)
    res.status(500).json({ message: "TalkJS error!" })
  }
}
