import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Shipping profiles are operator-owned — vendors can only read them — so tests
 * seed them through the fulfillment module instead of a vendor endpoint.
 */
export const createShippingProfile = async (
    container: MedusaContainer,
    data: { name: string; type?: string }
) => {
    const fulfillmentModule: any = container.resolve(Modules.FULFILLMENT)

    const [shippingProfile] = await fulfillmentModule.createShippingProfiles([
        { type: "default", ...data },
    ])

    return shippingProfile
}
