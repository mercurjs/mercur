import { applyMercurPatches } from "../../index"

applyMercurPatches({ logger: { debug: () => {}, warn: () => {} } })

const { markOrderFulfillmentAsDeliveredWorkflow } = require("../../../workflows")

process.stdout.write(
  JSON.stringify(
    typeof markOrderFulfillmentAsDeliveredWorkflow.hooks.fulfillmentDelivered
  )
)
