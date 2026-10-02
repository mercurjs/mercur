import { applyMercurPatches } from "../../index"

applyMercurPatches({ logger: { info: () => {}, warn: () => {} } })

const { markOrderFulfillmentAsDeliveredWorkflow } = require("../../../workflows")

process.stdout.write(
  JSON.stringify(
    typeof markOrderFulfillmentAsDeliveredWorkflow.hooks.fulfillmentDelivered
  )
)
