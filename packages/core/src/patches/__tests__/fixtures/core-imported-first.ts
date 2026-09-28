import "../../../with-mercur"

const coreFlows = require("@medusajs/core-flows")

process.stdout.write(
  JSON.stringify([
    typeof coreFlows.capturePaymentWorkflow.hooks.paymentCaptured,
    typeof coreFlows.refundPaymentWorkflow.hooks.paymentRefunded,
  ])
)
