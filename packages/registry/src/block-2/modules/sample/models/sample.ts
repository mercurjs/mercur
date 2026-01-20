import { model } from "@medusajs/framework/utils"

const Sample = model.define("sample", {
  id: model.id().primaryKey(),
  name: model.text(),
})

export default Sample
