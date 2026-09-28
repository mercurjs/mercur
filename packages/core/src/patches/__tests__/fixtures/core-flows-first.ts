import { applyMercurPatches } from "../../index"

const hookTypes = () => {
  const coreFlows = require("@medusajs/core-flows")
  return [
    typeof coreFlows.capturePaymentWorkflow.hooks.paymentCaptured,
    typeof coreFlows.refundPaymentWorkflow.hooks.paymentRefunded,
  ]
}

const before = hookTypes()
applyMercurPatches({ logger: { info: () => {}, warn: () => {} } })

process.stdout.write(JSON.stringify({ before, after: hookTypes() }))
