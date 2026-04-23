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

export type CreateAdminUserOptions = {
    email?: string
    /**
     * Provision a wildcard RBAC role and embed it in the JWT app_metadata.
     * Default true — required for admin integration tests to clear the
     * framework's checkPermissions middleware when `rbac` feature flag is on.
     * Set to false to reproduce a pre-provisioning edge case.
     */
    withSuperAdminRole?: boolean
}

const provisionSuperAdminRole = async (
    container: MedusaContainer,
    label: string
): Promise<string | null> => {
    let rbacService: any
    try {
        rbacService = container.resolve(Modules.RBAC)
    } catch {
        // RBAC module not loaded (feature flag off in this deployment).
        return null
    }
    if (!rbacService?.createRbacPolicies || !rbacService?.createRbacRoles) {
        return null
    }

    const policies = await rbacService.createRbacPolicies([
        { key: `test-superadmin-wildcard-${Date.now()}`, resource: "*", operation: "*" },
    ])
    const roles = await rbacService.createRbacRoles([
        { name: `test-superadmin-${label}-${Date.now()}` },
    ])
    await rbacService.createRbacRolePolicies([
        { role_id: roles[0].id, policy_id: policies[0].id },
    ])
    return roles[0].id
}

export const createAdminUser = async (
    dbConnection,
    adminHeaders,
    container?,
    options?: CreateAdminUserOptions
) => {
    const appContainer: MedusaContainer = container
    const email = options?.email ?? "admin@medusa.js"
    const withSuperAdminRole = options?.withSuperAdminRole !== false

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

    const roleId = withSuperAdminRole
        ? await provisionSuperAdminRole(appContainer, email)
        : null

    const config = appContainer.resolve(
        ContainerRegistrationKeys.CONFIG_MODULE
    )
    const { projectConfig } = config as any
    const { jwtSecret, jwtOptions } = projectConfig.http
    const tokenPayload: Record<string, unknown> = {
        actor_id: user.id,
        actor_type: "user",
        auth_identity_id: authIdentity.id,
    }
    if (roleId) {
        tokenPayload.app_metadata = { roles: [roleId] }
    }
    const token = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: "1d",
        ...jwtOptions,
    })

    adminHeaders.headers["authorization"] = `Bearer ${token}`

    return { user, authIdentity, roleId }
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