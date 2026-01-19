import { model } from "@medusajs/framework/utils"

const Test = model.define("test", {
  id: model.id().primaryKey(),
  name: model.text(),
})

export default Test
