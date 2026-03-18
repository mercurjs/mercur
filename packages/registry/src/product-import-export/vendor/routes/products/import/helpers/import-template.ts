const IMPORT_TEMPLATE_HEADER = [
  "Product Id",
  "Product Handle",
  "Product Title",
  "Product Subtitle",
  "Product Description",
  "Product Status",
  "Product Thumbnail",
  "Product Weight",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product HS Code",
  "Product Origin Country",
  "Product MID Code",
  "Product Material",
  "Product Collection Id",
  "Product Collection Title",
  "Product Type Id",
  "Product Type",
  "Product Tags",
  "Product Discountable",
  "Product External Id",
  "Variant Id",
  "Variant Title",
  "Variant SKU",
  "Variant Barcode",
  "Variant Inventory Quantity",
  "Variant Allow Backorder",
  "Variant Manage Inventory",
  "Variant Weight",
  "Variant Length",
  "Variant Width",
  "Variant Height",
  "Variant HS Code",
  "Variant Origin Country",
  "Variant MID Code",
  "Variant Material",
  "Variant EAN",
  "Variant UPC",
  "Option 1 Name",
  "Option 1 Value",
  "Option 2 Name",
  "Option 2 Value",
  "Price USD",
  "Price EUR",
]

export const getImportTemplateContent = (): string => {
  return IMPORT_TEMPLATE_HEADER.join(",") + "\n"
}

export const downloadImportTemplate = () => {
  const content = getImportTemplateContent()
  const blob = new Blob([content], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "product-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}
