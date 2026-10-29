import { container as globalContainer } from "@medusajs/framework"
import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type TelemetryModuleService from "../../modules/telemetry/service"
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_JITTER_MS,
  HEARTBEAT_MIN_GAP_SECONDS,
  startupDelayMs,
  TELEMETRY_DOCS_URL,
  telemetryDisabledReason,
} from "./config"
import { isTelemetryConfigEnabled, TelemetryMilestones } from "./milestones"
import { createTelemetrySender, TelemetryEvent } from "./sender"
import { collectSnapshot, InstallationRecord } from "./snapshot"

let scheduled = false
const startedAt = Date.now()

const uptimeSeconds = () => Math.floor((Date.now() - startedAt) / 1_000)

const groupIdentify = (installation: InstallationRecord, snapshot: Record<string, unknown>): TelemetryEvent => {
  const { $groups: _groups, ...properties } = snapshot
  return {
    event: "$groupidentify",
    distinct_id: installation.installation_id,
    properties: {
      $group_type: "installation",
      $group_key: installation.installation_id,
      $group_set: properties,
    },
  }
}

const bucketMilestones: Array<[string, (typeof TelemetryMilestones)[keyof typeof TelemetryMilestones]]> = [
  ["payouts_paid", TelemetryMilestones.FIRST_PAYOUT_PAID],
  ["commission_rules_total", TelemetryMilestones.FIRST_COMMISSION_RULE],
]

async function report(container: MedusaContainer, event: "instance_started" | "instance_heartbeat") {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const service = container.resolve<TelemetryModuleService>(MercurModules.TELEMETRY)
  const sender = createTelemetrySender({ logger })

  const installation = await service.getOrCreateInstallation()
  const snapshot = await collectSnapshot(container, installation, uptimeSeconds())
  const events: TelemetryEvent[] = [
    { event, distinct_id: installation.installation_id, properties: snapshot },
    groupIdentify(installation, snapshot),
  ]

  const version = snapshot.mercur_version as string | undefined
  if (version && installation.last_reported_version && installation.last_reported_version !== version) {
    events.push({
      event: "instance_upgraded",
      distinct_id: installation.installation_id,
      properties: { ...snapshot, from_version: installation.last_reported_version, to_version: version },
    })
  }

  const milestones = (installation.milestones ?? {}) as Record<string, string>
  const dueMilestones = [
    ...(snapshot.node_env === "production" ? [TelemetryMilestones.FIRST_PRODUCTION_BOOT] : []),
    ...bucketMilestones.filter(([key]) => snapshot[key] && snapshot[key] !== "0").map(([, m]) => m),
  ].filter((m) => !milestones[m])

  for (const milestone of dueMilestones) {
    if (await service.recordMilestone(milestone)) {
      events.push({
        event: "installation_milestone",
        distinct_id: installation.installation_id,
        properties: { ...snapshot, milestone, days_since_install: snapshot.instance_age_days },
      })
    }
  }

  await sender.capture(events)

  if (version && installation.last_reported_version !== version) {
    await service.setReportedVersion(version)
  }
}

function scheduleHeartbeat(container: MedusaContainer) {
  const delay = HEARTBEAT_INTERVAL_MS + Math.floor(Math.random() * HEARTBEAT_JITTER_MS)
  const timer = setTimeout(async () => {
    try {
      const service = container.resolve<TelemetryModuleService>(MercurModules.TELEMETRY)
      if (await service.claimHeartbeat(HEARTBEAT_MIN_GAP_SECONDS)) {
        await report(container, "instance_heartbeat")
      }
    } catch (error) {
      container.resolve<Logger>(ContainerRegistrationKeys.LOGGER).debug(`[telemetry] heartbeat skipped: ${(error as Error)?.message}`)
    } finally {
      scheduleHeartbeat(container)
    }
  }, delay)
  timer.unref()
}

async function run(container: MedusaContainer) {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const reason = telemetryDisabledReason({ configEnabled: isTelemetryConfigEnabled(container) })

  if (reason) {
    logger.debug(`[telemetry] disabled (${reason}). ${TELEMETRY_DOCS_URL}`)
    return
  }

  try {
    const service = container.resolve<TelemetryModuleService>(MercurModules.TELEMETRY)
    await service.getOrCreateInstallation()
    await service.claimHeartbeat(0)
    await report(container, "instance_started")
  } catch (error) {
    logger.debug(`[telemetry] boot report skipped: ${(error as Error)?.message}`)
  }

  scheduleHeartbeat(container)
}

/**
 * Called from the plugin's API middleware file, which Medusa only loads in
 * processes that serve HTTP. Worker processes, `medusa exec` and migrations
 * never import it, so a boot event means a real server came up.
 */
export function scheduleTelemetryBoot(container: MedusaContainer = globalContainer as MedusaContainer) {
  if (scheduled) return
  scheduled = true

  const timer = setTimeout(() => {
    run(container).catch(() => undefined)
  }, startupDelayMs())
  timer.unref()
}
