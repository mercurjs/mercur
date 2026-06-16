import { LoaderOptions } from "@medusajs/framework/types"

/**
 * Ensures the Global Commission (the `is_default` rate) always exists.
 *
 * The migration seeds it too, but the test infra applies schema from the
 * models (not the migration data steps), so a boot-time loader is the
 * reliable mechanism. It is idempotent — it only creates the row when no
 * `is_default` rate is present — and guarded by the same flag as the
 * migration seed, so the two never both create.
 */
export default async function seedDefaultCommissionRateLoader({
  container,
  logger,
}: LoaderOptions) {
  try {
    const rateService: any = container.resolve("commissionRateService")

    const existing = await rateService.list({ is_default: true }, { take: 1 })
    if (existing.length) {
      return
    }

    await rateService.create({
      name: "Default",
      code: "default",
      type: "percentage",
      value: 0,
      is_enabled: true,
      is_default: true,
      include_tax: false,
      include_shipping: false,
    })
  } catch (error) {
    logger?.warn(
      `Failed to seed the default commission rate: ${(error as Error)?.message ?? error
      }`
    )
  }
}
