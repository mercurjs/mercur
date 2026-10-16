import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

export const linkSellerRegions = async (
    container: MedusaContainer,
    sellerId: string,
    regionIds: string[]
) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)

    await remoteLink.create(
        regionIds.map((regionId) => ({
            [Modules.REGION]: { region_id: regionId },
            [MercurModules.SELLER]: { seller_id: sellerId },
        }))
    )
}
