import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import SampleModule from "../modules/sample"

export default defineLink(
  ProductModule.linkable.product,
  SampleModule.linkable.sample
)
