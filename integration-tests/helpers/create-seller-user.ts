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
import { createSellersWorkflow } from "@mercurjs/core/workflows"

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

    const { result: sellers } = await createSellersWorkflow(container).run({
        input: {
            sellers: [
                {
                    name,
                    email,
                    currency_code: "usd",
                    member: { email },
                },
            ],
        },
    })

    const seller = sellers[0]

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: members } = await query.graph({
        entity: "member",
        fields: ["id"],
        filters: { email },
    })

    const member = members[0]

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
            member_id: member.id,
        },
    })

    const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const { projectConfig } = config
    const { jwtSecret, jwtOptions } = projectConfig.http
    const token = jwt.sign(
        {
            actor_id: member.id,
            actor_type: "member",
            auth_identity_id: authIdentity.id,
        },
        jwtSecret,
        {
            expiresIn: "1d",
            ...jwtOptions,
        }
    )

    vendorHeaders.headers["authorization"] = `Bearer ${token}`
    vendorHeaders.headers["x-seller-id"] = seller.id

    const headers = {
        headers: {
            authorization: `Bearer ${token}`,
            "x-seller-id": seller.id,
        },
    }

    return { seller, member, authIdentity, headers }
}
