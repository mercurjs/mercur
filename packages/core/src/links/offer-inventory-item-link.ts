import { defineLink } from "@medusajs/framework/utils"
import InventoryModule from "@medusajs/medusa/inventory"
import OfferModule from "../modules/offer"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    isList: true,
  },
  {
    linkable: InventoryModule.linkable.inventoryItem,
    isList: true,
  },
  {
    database: {
      table: "offer_inventory_item",
      extraColumns: {
        required_quantity: {
          type: "integer",
          defaultValue: "1",
        },
      },
    },
  }
)
