import { InferEntityType } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import { randomUUID } from "node:crypto"

import { TelemetryInstallation, TELEMETRY_INSTALLATION_ID } from "./models"
import { TelemetryHeartbeatRepository } from "./repositories"

type Installation = InferEntityType<typeof TelemetryInstallation>

type InjectedDependencies = {
  telemetryHeartbeatRepository: TelemetryHeartbeatRepository
}

class TelemetryModuleService extends MedusaService({ TelemetryInstallation }) {
  protected readonly heartbeatRepository_: TelemetryHeartbeatRepository

  constructor({ telemetryHeartbeatRepository }: InjectedDependencies) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
    this.heartbeatRepository_ = telemetryHeartbeatRepository
  }

  async getOrCreateInstallation(): Promise<Installation> {
    const [existing] = await this.listTelemetryInstallations(
      { id: TELEMETRY_INSTALLATION_ID },
      { take: 1 },
    )
    if (existing) {
      return existing
    }

    try {
      return await this.createTelemetryInstallations({
        id: TELEMETRY_INSTALLATION_ID,
        installation_id: randomUUID(),
        milestones: {},
      })
    } catch {
      // Another replica won the insert race; read its row.
      const [row] = await this.listTelemetryInstallations(
        { id: TELEMETRY_INSTALLATION_ID },
        { take: 1 },
      )
      return row
    }
  }

  async claimHeartbeat(minGapSeconds: number): Promise<boolean> {
    return this.heartbeatRepository_.claimHeartbeat(minGapSeconds)
  }

  async recordMilestone(name: string): Promise<boolean> {
    const installation = await this.getOrCreateInstallation()
    const milestones = (installation.milestones ?? {}) as Record<string, string>
    if (milestones[name]) {
      return false
    }

    await this.updateTelemetryInstallations({
      id: TELEMETRY_INSTALLATION_ID,
      milestones: { ...milestones, [name]: new Date().toISOString() },
    })
    return true
  }

  async setReportedVersion(version: string): Promise<void> {
    await this.updateTelemetryInstallations({
      id: TELEMETRY_INSTALLATION_ID,
      last_reported_version: version,
    })
  }
}

export default TelemetryModuleService
