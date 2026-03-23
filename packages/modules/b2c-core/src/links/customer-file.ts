import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import FileModule from "@medusajs/medusa/file"

export default defineLink(
  CustomerModule.linkable.customer,
  {
    linkable: FileModule.linkable.file,
    isList: false,
    deleteCascade: false
  }
)
