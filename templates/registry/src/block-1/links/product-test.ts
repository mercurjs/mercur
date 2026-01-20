import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import TestModule from "../modules/test"

export default defineLink(
  ProductModule.linkable.product,
  TestModule.linkable.test
)
