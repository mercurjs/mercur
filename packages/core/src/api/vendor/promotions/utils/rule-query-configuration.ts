export const ruleQueryConfigurations: Record<
  string,
  { entryPoint: string; labelAttr: string; valueAttr: string; sellerScoped?: boolean }
> = {
  region: {
    entryPoint: "region",
    labelAttr: "name",
    valueAttr: "id",
  },
  currency_code: {
    entryPoint: "currency",
    labelAttr: "name",
    valueAttr: "code",
  },
  customer_group: {
    entryPoint: "customer_group",
    labelAttr: "name",
    valueAttr: "id",
    sellerScoped: true,
  },
  sales_channel: {
    entryPoint: "sales_channel",
    labelAttr: "name",
    valueAttr: "id",
  },
  country: {
    entryPoint: "country",
    labelAttr: "display_name",
    valueAttr: "iso_2",
  },
  offer: {
    entryPoint: "offer",
    labelAttr: "sku",
    valueAttr: "id",
    sellerScoped: true,
  },
  product: {
    entryPoint: "product",
    labelAttr: "title",
    valueAttr: "id",
    sellerScoped: true,
  },
  product_category: {
    entryPoint: "product_category",
    labelAttr: "name",
    valueAttr: "id",
    sellerScoped: true,
  },
  product_collection: {
    entryPoint: "product_collection",
    labelAttr: "title",
    valueAttr: "id",
  },
  product_type: {
    entryPoint: "product_type",
    labelAttr: "value",
    valueAttr: "id",
  },
  product_tag: {
    entryPoint: "product_tag",
    labelAttr: "value",
    valueAttr: "id",
  },
  shipping_option_type: {
    entryPoint: "shipping_option_type",
    labelAttr: "label",
    valueAttr: "id",
  },
}
