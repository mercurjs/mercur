import {
    ApiKeyDTO,
    IApiKeyModuleService,
    IAuthModuleService,
    IUserModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ApiKeyType,
    ContainerRegistrationKeys,
    Modules,
    PUBLISHABLE_KEY_HEADER,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"

export const adminHeaders = {
    headers: { "x-medusa-access-token": "test_token" },
}

export const createAdminUser = async (
    dbConnection,
    adminHeaders,
    container?,
    options?: { email?: string }
) => {
    const appContainer = container
    const email = options?.email ?? "admin@medusa.js"

    const userModule: IUserModuleService = appContainer.resolve(Modules.USER)
    const authModule: IAuthModuleService = appContainer.resolve(Modules.AUTH)
    const user = await userModule.createUsers({
        first_name: "Admin",
        last_name: "User",
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
            user_id: user.id,
        },
    })

    const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const { projectConfig } = config
    const { jwtSecret, jwtOptions } = projectConfig.http
    const token = jwt.sign(
        {
            actor_id: user.id,
            actor_type: "user",
            auth_identity_id: authIdentity.id,
        },
        jwtSecret,
        {
            expiresIn: "1d",
            ...jwtOptions,
        }
    )

    adminHeaders.headers["authorization"] = `Bearer ${token}`

    return { user, authIdentity }
}

export const generatePublishableKey = async (container: MedusaContainer) => {
    const apiKeyModule = container.resolve<IApiKeyModuleService>(
        Modules.API_KEY
    )

    return await apiKeyModule.createApiKeys({
        title: "test publishable key",
        type: ApiKeyType.PUBLISHABLE,
        created_by: "test",
    })
}

export const generateStoreHeaders = ({
    publishableKey,
}: {
    publishableKey: ApiKeyDTO
}) => {
    return {
        headers: {
            [PUBLISHABLE_KEY_HEADER]: publishableKey.token,
        },
    }
}