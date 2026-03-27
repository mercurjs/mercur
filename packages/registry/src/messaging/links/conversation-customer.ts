import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"

import MessagingModule from "../modules/messaging"

export default defineLink(CustomerModule.linkable.customer, {
  linkable: MessagingModule.linkable.conversation,
  isList: true,
})
