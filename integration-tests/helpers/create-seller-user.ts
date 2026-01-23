import {
    IAuthModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

export const vendorHeaders = {
    headers: { "x-medusa-access-token": "test_token" },
}

export const createSellerUser = async (
    container: MedusaContainer,
    options?: { email?: string; name?: string }
) => {
    const email = options?.email ?? "seller@medusa.js"
    const name = options?.name ?? "Test Seller"

    const authModule: IAuthModuleService = container.resolve(Modules.AUTH)

    const sellerModule = container.resolve("seller")

    const seller = await sellerModule.createSellers({
        name,
        email
    })
    const hashConfig = { logN: 15, r: 8, p: 1 }
    const passwordHash = await Scrypt.kdf("somepassword", hashConfig)

    const authIdentity = await authModule.createAuthIdentities({
        provider_identities: [
            {
                provider: "emailpass",
                entity_id: email,
                provider_metadata: {
                    password: passwordHash.toString("base64"),
                },
            },
        ],
        app_metadata: {
            seller_id: seller.id,
        },
    })

    const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const { projectConfig } = config
    const { jwtSecret, jwtOptions } = projectConfig.http
    const token = jwt.sign(
        {
            actor_id: seller.id,
            actor_type: "seller",
            auth_identity_id: authIdentity.id,
        },
        jwtSecret,
        {
            expiresIn: "1d",
            ...jwtOptions,
        }
    )

    vendorHeaders.headers["authorization"] = `Bearer ${token}`

    const headers = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    }

    return { seller, authIdentity, headers }
}
