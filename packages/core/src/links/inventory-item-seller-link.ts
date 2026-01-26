import { defineLink } from "@medusajs/framework/utils"
import InventoryModule from "@medusajs/medusa/inventory"
import SellerModule from "../modules/seller"

export default defineLink(InventoryModule.linkable.inventoryItem, SellerModule.linkable.seller)
