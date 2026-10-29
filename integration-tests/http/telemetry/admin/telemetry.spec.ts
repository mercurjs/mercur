import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { approveSellerWorkflow } from "@mercurjs/core/workflows"
import http from "node:http"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

type CapturedEvent = {
  event: string
  distinct_id: string
  properties: Record<string, unknown>
}

const captured: CapturedEvent[] = []
const CAPTURE_PORT = 48127

// Listening before the runner boots the app, because `instance_started` is
// sent right after the HTTP server comes up.
const captureServer = http
  .createServer((req, res) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body)
        expect(req.url).toBe("/batch")
        expect(parsed.api_key).toBe("mercur")
        captured.push(...parsed.batch)
      } catch {
        // Malformed bodies surface as missing events in the assertions below.
      }
      res.writeHead(200, { "content-type": "application/json" })
      res.end("{}")
    })
  })
  .listen(CAPTURE_PORT, "127.0.0.1")

const waitFor = async (predicate: () => boolean, timeoutMs = 15000) => {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for telemetry. Captured: ${JSON.stringify(captured.map((e) => e.event))}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

const FORBIDDEN_KEYS = ["email", "config", "url", "cwd", "hostname", "aliasPrefix", "systemInfo"]
const BUCKETS = ["0", "1-10", "11-100", "101-1k", "1k-10k", "10k-100k", "100k+"]

const milestoneEvents = (name: string) =>
  captured.filter((e) => e.event === "installation_milestone" && e.properties.milestone === name)

medusaIntegrationTestRunner({
  env: {
    MERCUR_TELEMETRY_FORCE_ENABLED: "true",
    MERCUR_TELEMETRY_PROXY_URL: `http://127.0.0.1:${CAPTURE_PORT}`,
    MERCUR_TELEMETRY_STARTUP_DELAY_MS: "0",
  },
  testSuite: ({ getContainer }) => {
    describe("Telemetry", () => {
      let container: MedusaContainer

      beforeAll(async () => {
        container = getContainer()
        await waitFor(() => captured.some((e) => e.event === "instance_started"))
      })

      afterAll(() => {
        captureServer.close()
      })

      it("sends instance_started for the installation stored in the database", async () => {
        const service = container.resolve<{
          getOrCreateInstallation: () => Promise<{ installation_id: string }>
        }>(MercurModules.TELEMETRY)
        const installation = await service.getOrCreateInstallation()

        const started = captured.find((e) => e.event === "instance_started")!
        expect(started.distinct_id).toBe(installation.installation_id)

        const props = started.properties
        expect(props.schema_version).toBe(1)
        expect(props.source).toBe("server")
        expect(props.installation_id).toBe(installation.installation_id)
        expect(props.$groups).toEqual({ installation: installation.installation_id, project: props.project_id })
        expect(props.$geoip_disable).toBe(true)
        expect(typeof props.project_id).toBe("string")
        expect(props.node_version).toBe(process.version)
        expect(typeof props.mercur_version).toBe("string")
        expect(Array.isArray(props.plugins)).toBe(true)
        expect(props.plugins).toContain("@mercurjs/core")
        expect(typeof props.custom_plugin_count).toBe("number")

        for (const key of ["sellers_total", "offers_total", "order_groups_total", "regions_total"]) {
          expect(BUCKETS).toContain(props[key])
        }
        for (const key of FORBIDDEN_KEYS) {
          expect(props).not.toHaveProperty(key)
        }

        const identify = captured.find((e) => e.event === "$groupidentify")!
        expect(identify.properties.$group_type).toBe("installation")
        expect(identify.properties.$group_key).toBe(installation.installation_id)
      })

      it("never names custom plugins", () => {
        const started = captured.find((e) => e.event === "instance_started")!
        for (const name of started.properties.plugins as string[]) {
          expect(name.startsWith("@mercurjs/") || name.startsWith("@medusajs/")).toBe(true)
        }
        for (const name of started.properties.modules as string[]) {
          expect(name.startsWith("@mercurjs/") || name.startsWith("@medusajs/")).toBe(true)
        }
      })

      it("reuses the installation id and lets only one heartbeat claim through", async () => {
        const service = container.resolve<{
          getOrCreateInstallation: () => Promise<{ installation_id: string }>
          claimHeartbeat: (gap: number) => Promise<boolean>
          updateTelemetryInstallations: (data: { id: string; last_heartbeat_at: Date | null }) => Promise<unknown>
        }>(MercurModules.TELEMETRY)
        const DAY = 23 * 60 * 60

        const first = await service.getOrCreateInstallation()
        const second = await service.getOrCreateInstallation()
        expect(second.installation_id).toBe(first.installation_id)

        // Boot already claimed the slot, so a 23 h gap is not due yet.
        expect(await service.claimHeartbeat(DAY)).toBe(false)

        await service.updateTelemetryInstallations({ id: "singleton", last_heartbeat_at: null })
        const [a, b] = await Promise.all([service.claimHeartbeat(DAY), service.claimHeartbeat(DAY)])
        expect([a, b].filter(Boolean)).toHaveLength(1)
      })

      it("records each milestone exactly once", async () => {
        const { seller } = await createSellerUser(container, { email: "first@seller.test", name: "First" })
        await waitFor(() => milestoneEvents("first_seller").length === 1)

        await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
        await waitFor(() => milestoneEvents("first_seller_approved").length === 1)

        const milestone = milestoneEvents("first_seller")[0]
        expect(milestone.properties.days_since_install).toBe(0)
        expect(milestone.properties).not.toHaveProperty("seller_id")
        expect(milestone.properties).not.toHaveProperty("id")

        const { seller: another } = await createSellerUser(container, { email: "second@seller.test", name: "Second" })
        await approveSellerWorkflow(container).run({ input: { seller_id: another.id } })
        await new Promise((resolve) => setTimeout(resolve, 1500))

        expect(milestoneEvents("first_seller")).toHaveLength(1)
        expect(milestoneEvents("first_seller_approved")).toHaveLength(1)
      })
    })
  },
})
