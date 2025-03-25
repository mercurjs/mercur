import { AdminCreateProduct } from "@medusajs/framework/types"

export interface VendorCreateProduct extends AdminCreateProduct{
    brand_name: string | null,
}