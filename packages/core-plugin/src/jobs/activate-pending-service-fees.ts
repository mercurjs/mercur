import { MedusaContainer } from "@medusajs/framework/types"
import { activatePendingServiceFeesWorkflow } from "../workflows/service-fee"

export default async function activatePendingServiceFeesJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")

  try {
    const { result } = await activatePendingServiceFeesWorkflow(
      container
    ).run()
    if (result.length > 0) {
      logger.info(
        `[activate-pending-service-fees] Activated ${result.length} service fees: ${result.map((f: { id: string }) => f.id).join(", ")}`
      )
    }
  } catch (error: any) {
    logger.error(
      `[activate-pending-service-fees] Failed: ${error.message}`
    )
  }
}

export const config = {
  name: "activate-pending-service-fees",
  schedule: "*/5 * * * *",
}
