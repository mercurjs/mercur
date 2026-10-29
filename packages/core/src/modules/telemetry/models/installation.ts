import { model } from "@medusajs/framework/utils"

export const TELEMETRY_INSTALLATION_ID = "singleton"

const TelemetryInstallation = model.define("telemetry_installation", {
  id: model.id().primaryKey(),
  installation_id: model.text().unique(),
  last_heartbeat_at: model.dateTime().nullable(),
  last_reported_version: model.text().nullable(),
  milestones: model.json().nullable(),
})

export default TelemetryInstallation
