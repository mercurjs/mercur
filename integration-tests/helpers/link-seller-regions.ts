import {
    IRegionModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
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

export const linkSellerCurrencyRegions = async (
    container: MedusaContainer,
    sellerId: string,
    currencyCodes: string[]
) => {
    const regionModule: IRegionModuleService = container.resolve(Modules.REGION)

    const regions = await regionModule.createRegions(
        currencyCodes.map((currency_code) => ({
            name: `${currency_code.toUpperCase()} region ${sellerId}`,
            currency_code,
            countries: [],
        }))
    )

    await linkSellerRegions(
        container,
        sellerId,
        regions.map((region) => region.id)
    )

    return regions
}
