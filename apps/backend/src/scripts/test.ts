import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { QueryContext } from "@medusajs/framework/utils";

export const productVariantsFields = [
    "id",
    "title",
    "sku",
    "manage_inventory",
    "allow_backorder",
    "requires_shipping",
    "is_discountable",
    "variant_option_values",
    "barcode",
    "product.id",
    "product.title",
    "product.description",
    "product.subtitle",
    "product.thumbnail",
    "product.type.value",
    "product.type.id",
    "product.collection.title",
    "product.handle",
    "product.discountable",
    "product.is_giftcard",
    "product.shipping_profile.id",
    "calculated_price.*",
    "inventory_items.inventory_item_id",
    "inventory_items.required_quantity",
    "inventory_items.inventory.requires_shipping",
    "inventory_items.inventory.location_levels.stocked_quantity",
    "inventory_items.inventory.location_levels.reserved_quantity",
    "inventory_items.inventory.location_levels.raw_stocked_quantity",
    "inventory_items.inventory.location_levels.raw_reserved_quantity",
    "inventory_items.inventory.location_levels.stock_locations.id",
    "inventory_items.inventory.location_levels.stock_locations.name",
    "inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
    "inventory_items.inventory.location_levels.stock_locations.sales_channels.name",
]



export default async function test({
    container
}: ExecArgs) {

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const variants = await query.graph({
        entity: "variant",
        fields: productVariantsFields,
        filters: {
            id: "variant_01JWK43NGT09CD19QADMES20CT",
        },
        context: {
            calculated_price: QueryContext({
                region_id: "reg_01JWJS62P907M8KYG8QRN8VFKF",
                currency_code: "inr",
            }),
        }

    })

    console.log(variants.data[0].calculated_price.calculated_amount)

}

