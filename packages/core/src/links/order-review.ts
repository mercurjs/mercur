import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import ReviewModule from "../modules/review"

export default defineLink(OrderModule.linkable.order, {
  linkable: ReviewModule.linkable.review,
  isList: true,
})
