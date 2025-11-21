/**
 * CSV Parser for Warehouse Brands Inventory
 * 
 * Handles Parent/Child product structure from CSV
 */

export interface CSVRow {
  // Status
  'Status': string
  
  // Product Info
  'Title': string
  'SKU': string
  'Quantity (UK)': string
  'Product Type': string
  'Item Name': string
  
  // Brand & Manufacturer
  'Brand Name': string
  'Manufacturer': string
  
  // Product Identifiers
  'Product Id Type': string
  'Product Id': string
  'Part Number': string
  
  // Pricing
  'Sell Price': string
  
  // Description
  'Product Description': string
  'Bullet Point': string
  'Generic Keyword': string
  
  // Variant Info
  'Colour': string
  'Size': string
  
  // Unit/Measurement Info
  'Unit Count': string
  'Unit Count Type': string
  
  // Special Features (multiple columns with same name)
  'Special Features': string
  
  // Parentage
  'Parentage Level': 'Parent' | 'Child' | ''
  'Child Relation': string
  'Parent SKU': string
  'Variation Theme Name': string
  
  // Images
  'Main Image URL': string
  'Image 2': string
  'Image 3': string
  'Image 4': string
  'Image 5': string
  'Image 6': string
  'Image 7': string
  'Image 8': string
  'Image 9': string
  
  // Restrictions
  'Age Restricted': string
  
  // Dimensions
  'Length Range': string
  'Width Range': string
  'Item Thickness Decimal Value': string
  'Item Thickness Unit': string
  'Item Length Longer Edge': string
  'Item Length Unit': string
  'Item Width Shorter Edge': string
  'Item Width Unit': string
  
  // Weight
  'Item Weight': string
  'Item Weight Unit': string
  
  // Additional fields that might exist
  [key: string]: string
}

export interface ParentGroup {
  parentSKU: string
  parentRow: CSVRow
  childRows: CSVRow[]
}

/**
 * Group CSV rows by Parent SKU
 * One group = one product with variants
 * Rows without Parent SKU are treated as standalone products (single variant)
 */
export function groupByParentSKU(rows: CSVRow[]): ParentGroup[] {
  const groups = new Map<string, ParentGroup>()
  
  for (const row of rows) {
    let parentSKU = row['Parent SKU']
    
    // If no Parent SKU, treat as standalone product (use own SKU as parent)
    if (!parentSKU || parentSKU.trim() === '') {
      parentSKU = row['SKU']
    }
    
    if (!groups.has(parentSKU)) {
      groups.set(parentSKU, {
        parentSKU,
        parentRow: row, // will be updated if we find actual parent
        childRows: []
      })
    }
    
    const group = groups.get(parentSKU)!
    
    if (row['Parentage Level'] === 'Parent') {
      // This is the parent row - use it as the main product info
      group.parentRow = row
    } else if (row['Parentage Level'] === 'Child') {
      // This is a child variant
      group.childRows.push(row)
    } else if (!row['Parentage Level'] || (row['Parentage Level'] as string).trim() === '') {
      // No parentage level specified - treat as both parent and child
      group.parentRow = row
      group.childRows.push(row)
    }
  }
  
  return Array.from(groups.values())
}

/**
 * Extract price from row
 */
export function extractPrice(row: CSVRow): number {
  const priceStr = row['Sell Price'] || '0'
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
  return isNaN(price) ? 0 : price
}

/**
 * Extract quantity from row
 */
export function extractQuantity(row: CSVRow): number {
  const qtyStr = row['Quantity (UK)'] || '0'
  const qty = parseInt(qtyStr.replace(/[^0-9]/g, ''))
  return isNaN(qty) ? 0 : qty
}

/**
 * Extract all images from row (Main + Image 2-9)
 */
export function extractImages(row: CSVRow): string[] {
  const images: string[] = []
  
  // Main image
  if (row['Main Image URL']) {
    images.push(row['Main Image URL'])
  }
  
  // Additional images (Image 2-9)
  for (let i = 2; i <= 9; i++) {
    const imgKey = `Image ${i}`
    if (row[imgKey]) {
      images.push(row[imgKey])
    }
  }
  
  return images.filter(url => url && url.trim() !== '')
}

/**
 * Extract variant metadata from row
 */
export function extractVariantMetadata(row: CSVRow): Record<string, any> {
  const metadata: Record<string, any> = {
    child_sku: row['SKU'],
    quantity_uk: extractQuantity(row),
  }
  
  // Variant info
  if (row['Colour']) metadata.colour = row['Colour']
  if (row['Size']) metadata.size = row['Size']
  
  // Unit info
  if (row['Unit Count']) metadata.unit_count = row['Unit Count']
  if (row['Unit Count Type']) metadata.unit_count_type = row['Unit Count Type']
  
  // Dimensions
  if (row['Length Range']) metadata.length_range = row['Length Range']
  if (row['Width Range']) metadata.width_range = row['Width Range']
  if (row['Item Thickness Decimal Value']) metadata.item_thickness = row['Item Thickness Decimal Value']
  if (row['Item Thickness Unit']) metadata.item_thickness_unit = row['Item Thickness Unit']
  if (row['Item Length Longer Edge']) metadata.item_length = row['Item Length Longer Edge']
  if (row['Item Length Unit']) metadata.item_length_unit = row['Item Length Unit']
  if (row['Item Width Shorter Edge']) metadata.item_width = row['Item Width Shorter Edge']
  if (row['Item Width Unit']) metadata.item_width_unit = row['Item Width Unit']
  
  // Weight
  if (row['Item Weight']) metadata.item_weight = row['Item Weight']
  if (row['Item Weight Unit']) metadata.item_weight_unit = row['Item Weight Unit']
  
  // Package dimensions
  if (row['Item Package Length']) metadata.package_length = row['Item Package Length']
  if (row['Package Length Unit']) metadata.package_length_unit = row['Package Length Unit']
  if (row['Item Package Width']) metadata.package_width = row['Item Package Width']
  if (row['Package Width Unit']) metadata.package_width_unit = row['Package Width Unit']
  if (row['Item Package Height']) metadata.package_height = row['Item Package Height']
  if (row['Package Height Unit']) metadata.package_height_unit = row['Package Height Unit']
  if (row['Item Package Weight']) metadata.package_weight = row['Item Package Weight']
  if (row['Item Package Weight Unit']) metadata.package_weight_unit = row['Item Package Weight Unit']
  
  // Product identifiers
  if (row['Part Number']) metadata.part_number = row['Part Number']
  if (row['Product Id']) metadata.product_id = row['Product Id']
  if (row['Product Id Type']) metadata.product_id_type = row['Product Id Type']
  
  return metadata
}

/**
 * Extract product-level metadata from parent row
 */
export function extractProductMetadata(row: CSVRow, parentSKU: string, sellerId: string): Record<string, any> {
  const metadata: Record<string, any> = {
    parent_sku: parentSKU,
    product_type: row['Product Type'],
    seller_id: sellerId,
    imported_at: new Date().toISOString(),
  }
  
  // Brand & Manufacturer
  if (row['Brand Name']) metadata.brand_name = row['Brand Name']
  if (row['Manufacturer']) metadata.manufacturer = row['Manufacturer']
  
  // Variation Theme (determines how to display variants)
  if (row['Variation Theme Name']) metadata.variation_theme = row['Variation Theme Name']
  
  // Unit Count Type (for calculator display)
  if (row['Unit Count Type']) metadata.unit_count_type = row['Unit Count Type']
  if (row['Unit Count']) metadata.unit_count = row['Unit Count']
  
  // Keywords & Bullet Points
  if (row['Bullet Point']) metadata.bullet_point = row['Bullet Point']
  if (row['Generic Keyword']) metadata.generic_keyword = row['Generic Keyword']
  
  // Special Features
  if (row['Special Features']) metadata.special_features = row['Special Features']
  
  // Restrictions
  if (row['Age Restricted']) metadata.age_restricted = row['Age Restricted']
  
  return metadata
}

/**
 * Validate that a parent group has required data
 */
export function validateParentGroup(group: ParentGroup): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!group.parentRow) {
    errors.push('No parent row found')
  }
  
  if (!group.parentRow['Item Name'] && !group.parentRow['Title']) {
    errors.push('No product name found')
  }
  
  if (!group.parentRow['Product Type']) {
    errors.push('No product type specified')
  }
  
  if (group.childRows.length === 0) {
    errors.push('No child variants found')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

