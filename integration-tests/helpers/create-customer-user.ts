import {
    IAuthModuleService,
    ICustomerModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

export const customerHeaders = {
    headers: { "x-medusa-access-token": "test_token" },
}

export const createCustomerUser = async (
    container: MedusaContainer,
    options?: { email?: string; first_name?: string; last_name?: string }
) => {
    const email = options?.email ?? "customer@medusa.js"
    const first_name = options?.first_name ?? "Test"
    const last_name = options?.last_name ?? "Customer"

    const authModule: IAuthModuleService = container.resolve(Modules.AUTH)
    const customerModule: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

    const customer = await customerModule.createCustomers({
        first_name,
        last_name,
        email,
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
            customer_id: customer.id,
        },
    })

    const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const { projectConfig } = config
    const { jwtSecret, jwtOptions } = projectConfig.http
    const token = jwt.sign(
        {
            actor_id: customer.id,
            actor_type: "customer",
            auth_identity_id: authIdentity.id,
        },
        jwtSecret,
        {
            expiresIn: "1d",
            ...jwtOptions,
        }
    )

    customerHeaders.headers["authorization"] = `Bearer ${token}`

    const headers = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    }

    return { customer, authIdentity, headers }
}
