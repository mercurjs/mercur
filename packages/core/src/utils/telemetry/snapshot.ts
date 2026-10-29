import { ConfigModule, MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayoutStatus, SellerStatus } from "@mercurjs/types"
import { existsSync } from "node:fs"
import os from "node:os"

import { toBucket } from "./buckets"
import { TELEMETRY_SCHEMA_VERSION } from "./config"
import { providerIdLabel, splitFirstParty } from "./first-party"
import { resolveProjectId } from "./identity"

export type InstallationRecord = {
  installation_id: string
  created_at: Date | string
}

type ModuleDeclaration = {
  resolve?: string
  options?: Record<string, unknown> & {
    providers?: Array<{ resolve?: string; id?: string }>
  }
  disable?: boolean
}

const MERCUR_FEATURE_FLAGS = ["seller_registration", "product_request"]

const CLOUD_PROVIDERS: Array<[string, string[]]> = [
  ["medusa-cloud", ["MEDUSA_CLOUD_ENVIRONMENT_HANDLE", "MEDUSA_CLOUD_API_KEY"]],
  ["render", ["RENDER", "RENDER_SERVICE_ID"]],
  ["fly-io", ["FLY_APP_NAME", "FLY_ALLOC_ID"]],
  ["railway", ["RAILWAY_ENVIRONMENT_NAME", "RAILWAY_STATIC_URL"]],
  ["heroku", ["DYNO", "HEROKU_APP_NAME"]],
  ["digitalocean", ["DO_DEPLOYMENT_ID", "DO_APP_NAME"]],
  ["koyeb", ["KOYEB_DEPLOYMENT_ID", "KOYEB_APP_NAME"]],
  ["vercel", ["VERCEL", "VERCEL_ENV"]],
  ["aws", ["AWS_EXECUTION_ENV", "ECS_CONTAINER_METADATA_URI", "AWS_REGION"]],
  ["gcp", ["K_SERVICE", "GOOGLE_CLOUD_PROJECT", "GCE_METADATA_HOST"]],
  ["azure", ["WEBSITE_SITE_NAME", "AZURE_FUNCTIONS_ENVIRONMENT"]],
]

const packageVersion = (name: string): string | undefined => {
  try {
    return (require(`${name}/package.json`) as { version?: string }).version
  } catch {
    return undefined
  }
}

const detectRuntime = () => (process.versions.bun ? "bun" : "node")

const detectPackageManager = (env: NodeJS.ProcessEnv) => {
  const agent = env.npm_config_user_agent ?? ""
  const match = agent.match(/^(bun|pnpm|yarn|npm)\//)
  return match?.[1]
}

const detectCloudProvider = (env: NodeJS.ProcessEnv) =>
  CLOUD_PROVIDERS.find(([, keys]) => keys.some((key) => Boolean(env[key])))?.[0] ?? null

const detectContainerized = (env: NodeJS.ProcessEnv) =>
  Boolean(env.KUBERNETES_SERVICE_HOST) || existsSync("/.dockerenv") || existsSync("/run/.containerenv")

const daysBetween = (from: Date | string, to = new Date()) =>
  Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 86_400_000))

const asModuleList = (modules: ConfigModule["modules"]): ModuleDeclaration[] => {
  if (!modules) return []
  const values = Array.isArray(modules) ? modules : Object.values(modules)
  return values.filter((m): m is ModuleDeclaration => typeof m === "object" && m !== null)
}

const findModule = (modules: ModuleDeclaration[], suffix: string) =>
  modules.find((m) => m.resolve?.endsWith(suffix))

const providerLabels = (module: ModuleDeclaration | undefined) =>
  (module?.options?.providers ?? [])
    .map((p) => providerIdLabel(p.resolve, p.id))
    .filter((p): p is string => Boolean(p))

export function collectBaseProperties(
  container: MedusaContainer,
  installation: InstallationRecord,
  env: NodeJS.ProcessEnv = process.env,
): Record<string, unknown> {
  const configModule = container.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)
  const projectId = resolveProjectId()

  return {
    schema_version: TELEMETRY_SCHEMA_VERSION,
    source: "server",
    installation_id: installation.installation_id,
    project_id: projectId,
    instance_age_days: daysBetween(installation.created_at),
    node_env: env.NODE_ENV ?? "development",
    mercur_version: packageVersion("@mercurjs/core"),
    medusa_version: packageVersion("@medusajs/medusa") ?? packageVersion("@medusajs/framework"),
    node_version: process.version,
    runtime: detectRuntime(),
    os: os.platform(),
    arch: os.arch(),
    worker_mode: configModule.projectConfig.workerMode ?? "shared",
    $groups: { installation: installation.installation_id, project: projectId },
  }
}

export function collectStackProperties(
  container: MedusaContainer,
  env: NodeJS.ProcessEnv = process.env,
): Record<string, unknown> {
  const configModule = container.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)
  const modules = asModuleList(configModule.modules)

  const pluginNames = (configModule.plugins ?? []).map((p) =>
    typeof p === "string" ? p : p.resolve,
  )
  const plugins = splitFirstParty(pluginNames)
  const moduleNames = splitFirstParty(modules.filter((m) => !m.disable).map((m) => m.resolve))

  const payoutProviders = providerLabels(findModule(modules, "/payout"))
  const searchProvider = pluginNames.some((p) => p?.includes("algolia"))
    ? "algolia"
    : pluginNames.some((p) => p?.includes("meilisearch"))
      ? "meilisearch"
      : "none"

  const featureFlags = Object.entries(configModule.featureFlags ?? {})
    .filter(([key, value]) => MERCUR_FEATURE_FLAGS.includes(key) && Boolean(value))
    .map(([key]) => key)

  const cpus = os.cpus()

  return {
    package_manager: detectPackageManager(env),
    cpu_count: cpus.length || undefined,
    total_memory_gb: Math.round(os.totalmem() / 1024 ** 3),
    containerized: detectContainerized(env),
    cloud_provider: detectCloudProvider(env),
    redis_enabled: Boolean(configModule.projectConfig.redisUrl),
    plugins: plugins.first_party,
    custom_plugin_count: plugins.custom_count,
    modules: moduleNames.first_party,
    custom_module_count: moduleNames.custom_count,
    payment_providers: providerLabels(findModule(modules, "/payment")),
    payout_provider: payoutProviders[0] ?? "system",
    notification_providers: providerLabels(findModule(modules, "/notification")),
    file_provider: providerLabels(findModule(modules, "/file"))[0],
    search_provider: searchProvider,
    feature_flags: featureFlags,
    admin_disabled: configModule.admin?.disable ?? true,
  }
}

type CountSpec = {
  key: string
  entity: string
  filters?: Record<string, unknown>
}

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86_400_000).toISOString()

const COUNT_SPECS: CountSpec[] = [
  { key: "sellers_total", entity: "seller" },
  { key: "sellers_pending", entity: "seller", filters: { status: SellerStatus.PENDING_APPROVAL } },
  { key: "sellers_open", entity: "seller", filters: { status: SellerStatus.OPEN } },
  { key: "sellers_suspended", entity: "seller", filters: { status: SellerStatus.SUSPENDED } },
  { key: "members_total", entity: "member" },
  { key: "products_total", entity: "product" },
  { key: "products_published", entity: "product", filters: { status: "published" } },
  { key: "products_proposed", entity: "product", filters: { status: "proposed" } },
  { key: "offers_total", entity: "offer" },
  { key: "product_changes_pending", entity: "product_change", filters: { status: "pending" } },
  { key: "order_groups_total", entity: "order_group" },
  { key: "order_groups_last_30d", entity: "order_group", filters: { created_at: { $gte: thirtyDaysAgo() } } },
  { key: "orders_total", entity: "order" },
  { key: "payouts_paid", entity: "payout", filters: { status: PayoutStatus.PAID } },
  { key: "payouts_failed", entity: "payout", filters: { status: PayoutStatus.FAILED } },
  { key: "payout_accounts_active", entity: "payout_account", filters: { status: "active" } },
  { key: "commission_rules_total", entity: "commission_rule" },
  { key: "regions_total", entity: "region" },
  { key: "sales_channels_total", entity: "sales_channel" },
]

async function countEntity(query: RemoteQueryFunction, spec: CountSpec): Promise<number | undefined> {
  try {
    const { metadata } = await query.graph({
      entity: spec.entity,
      fields: ["id"],
      filters: spec.filters,
      pagination: { skip: 0, take: 1 },
    } as never)
    return metadata?.count
  } catch {
    return undefined
  }
}

async function postgresMajorVersion(container: MedusaContainer): Promise<string | undefined> {
  try {
    const knex = container.resolve<{ raw: (sql: string) => Promise<{ rows: Array<{ v: string }> }> }>(
      ContainerRegistrationKeys.PG_CONNECTION,
    )
    const { rows } = await knex.raw("SELECT current_setting('server_version') AS v")
    return rows[0]?.v?.split(".")[0]
  } catch {
    return undefined
  }
}

/**
 * Counts run one at a time on purpose: a heartbeat must never compete with
 * request traffic for the connection pool.
 */
export async function collectMarketplaceProperties(container: MedusaContainer): Promise<Record<string, unknown>> {
  const query = container.resolve<RemoteQueryFunction>(ContainerRegistrationKeys.QUERY)
  const result: Record<string, unknown> = {}

  for (const spec of COUNT_SPECS) {
    result[spec.key] = toBucket(await countEntity(query, spec))
  }

  try {
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["supported_currencies.currency_code"],
    } as never)
    const store = (stores as Array<{ supported_currencies?: unknown[] }>)[0]
    result.currencies_total = toBucket(store?.supported_currencies?.length)
  } catch {
    result.currencies_total = undefined
  }

  result.postgres_version = await postgresMajorVersion(container)

  return result
}

export async function collectSnapshot(
  container: MedusaContainer,
  installation: InstallationRecord,
  uptimeSeconds: number,
): Promise<Record<string, unknown>> {
  return {
    ...collectBaseProperties(container, installation),
    ...collectStackProperties(container),
    ...(await collectMarketplaceProperties(container)),
    uptime_seconds: uptimeSeconds,
  }
}
