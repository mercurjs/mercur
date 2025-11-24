/**
 * CSV Parser for Warehouse Brands Inventory
 * 
 * Handles Parent/Child product structure from CSV
 */

/**
 * Parentage level constants
 */
export const ParentageLevel = {
  PARENT: 'Parent',
  CHILD: 'Child',
  NONE: ''
} as const

export type ParentageLevelType = typeof ParentageLevel[keyof typeof ParentageLevel]

/**
 * Product status constants
 */
export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus]

/**
 * CSV column name constants
 */
export const CSVColumn = {
  // Core fields
  STATUS: 'Status',
  TITLE: 'Title',
  SKU: 'SKU',
  ITEM_NAME: 'Item Name',
  PRODUCT_TYPE: 'Product Type',
  PRODUCT_DESCRIPTION: 'Product Description',
  BULLET_POINT: 'Bullet Point',
  
  // Pricing & Quantity
  SELL_PRICE: 'Sell Price',
  QUANTITY_UK: 'Quantity (UK)',
  
  // Parentage
  PARENTAGE_LEVEL: 'Parentage Level',
  PARENT_SKU: 'Parent SKU',
  CHILD_RELATION: 'Child Relation',
  VARIATION_THEME_NAME: 'Variation Theme Name',
  
  // Variants
  COLOUR: 'Colour',
  SIZE: 'Size',
  
  // Images
  MAIN_IMAGE_URL: 'Main Image URL',
  
  // Brand
  BRAND_NAME: 'Brand Name',
  MANUFACTURER: 'Manufacturer',
  
  // Product Identifiers
  PRODUCT_ID: 'Product Id',
  PRODUCT_ID_TYPE: 'Product Id Type',
  PART_NUMBER: 'Part Number',
  
  // Keywords
  GENERIC_KEYWORD: 'Generic Keyword',
  SPECIAL_FEATURES: 'Special Features',
  
  // Units
  UNIT_COUNT: 'Unit Count',
  UNIT_COUNT_TYPE: 'Unit Count Type',
  
  // Dimensions
  LENGTH_RANGE: 'Length Range',
  WIDTH_RANGE: 'Width Range',
  ITEM_THICKNESS: 'Item Thickness Decimal Value',
  ITEM_THICKNESS_UNIT: 'Item Thickness Unit',
  ITEM_LENGTH: 'Item Length Longer Edge',
  ITEM_LENGTH_UNIT: 'Item Length Unit',
  ITEM_WIDTH: 'Item Width Shorter Edge',
  ITEM_WIDTH_UNIT: 'Item Width Unit',
  
  // Weight
  ITEM_WEIGHT: 'Item Weight',
  ITEM_WEIGHT_UNIT: 'Item Weight Unit',
  
  // Restrictions
  AGE_RESTRICTED: 'Age Restricted'
} as const

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
  'Parentage Level': ParentageLevelType
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
    let parentSKU = row[CSVColumn.PARENT_SKU]
    
    // If no Parent SKU, treat as standalone product (use own SKU as parent)
    if (!parentSKU || parentSKU.trim() === '') {
      parentSKU = row[CSVColumn.SKU]
    }
    
    if (!groups.has(parentSKU)) {
      groups.set(parentSKU, {
        parentSKU,
        parentRow: row, // will be updated if we find actual parent
        childRows: []
      })
    }
    
    const group = groups.get(parentSKU)!
    
    if (row[CSVColumn.PARENTAGE_LEVEL] === ParentageLevel.PARENT) {
      // This is the parent row - use it as the main product info
      group.parentRow = row
    } else if (row[CSVColumn.PARENTAGE_LEVEL] === ParentageLevel.CHILD) {
      // This is a child variant
      group.childRows.push(row)
    } else if (!row[CSVColumn.PARENTAGE_LEVEL] || row[CSVColumn.PARENTAGE_LEVEL].trim() === ParentageLevel.NONE) {
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
  const priceStr = row[CSVColumn.SELL_PRICE] || '0'
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
  return isNaN(price) ? 0 : price
}

/**
 * Extract quantity from row
 */
export function extractQuantity(row: CSVRow): number {
  const qtyStr = row[CSVColumn.QUANTITY_UK] || '0'
  const qty = parseInt(qtyStr.replace(/[^0-9]/g, ''))
  return isNaN(qty) ? 0 : qty
}

/**
 * Extract all images from row (Main + Image 2-9)
 */
export function extractImages(row: CSVRow): string[] {
  const images: string[] = []
  
  // Main image
  if (row[CSVColumn.MAIN_IMAGE_URL]) {
    images.push(row[CSVColumn.MAIN_IMAGE_URL])
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
    child_sku: row[CSVColumn.SKU],
    quantity_uk: extractQuantity(row),
  }
  
  // Variant info
  if (row[CSVColumn.COLOUR]) metadata.colour = row[CSVColumn.COLOUR]
  if (row[CSVColumn.SIZE]) metadata.size = row[CSVColumn.SIZE]
  
  // Unit info
  if (row[CSVColumn.UNIT_COUNT]) metadata.unit_count = row[CSVColumn.UNIT_COUNT]
  if (row[CSVColumn.UNIT_COUNT_TYPE]) metadata.unit_count_type = row[CSVColumn.UNIT_COUNT_TYPE]
  
  // Dimensions
  if (row[CSVColumn.LENGTH_RANGE]) metadata.length_range = row[CSVColumn.LENGTH_RANGE]
  if (row[CSVColumn.WIDTH_RANGE]) metadata.width_range = row[CSVColumn.WIDTH_RANGE]
  if (row[CSVColumn.ITEM_THICKNESS]) metadata.item_thickness = row[CSVColumn.ITEM_THICKNESS]
  if (row[CSVColumn.ITEM_THICKNESS_UNIT]) metadata.item_thickness_unit = row[CSVColumn.ITEM_THICKNESS_UNIT]
  if (row[CSVColumn.ITEM_LENGTH]) metadata.item_length = row[CSVColumn.ITEM_LENGTH]
  if (row[CSVColumn.ITEM_LENGTH_UNIT]) metadata.item_length_unit = row[CSVColumn.ITEM_LENGTH_UNIT]
  if (row[CSVColumn.ITEM_WIDTH]) metadata.item_width = row[CSVColumn.ITEM_WIDTH]
  if (row[CSVColumn.ITEM_WIDTH_UNIT]) metadata.item_width_unit = row[CSVColumn.ITEM_WIDTH_UNIT]
  
  // Weight
  if (row[CSVColumn.ITEM_WEIGHT]) metadata.item_weight = row[CSVColumn.ITEM_WEIGHT]
  if (row[CSVColumn.ITEM_WEIGHT_UNIT]) metadata.item_weight_unit = row[CSVColumn.ITEM_WEIGHT_UNIT]
  
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
  if (row[CSVColumn.PART_NUMBER]) metadata.part_number = row[CSVColumn.PART_NUMBER]
  if (row[CSVColumn.PRODUCT_ID]) metadata.product_id = row[CSVColumn.PRODUCT_ID]
  if (row[CSVColumn.PRODUCT_ID_TYPE]) metadata.product_id_type = row[CSVColumn.PRODUCT_ID_TYPE]
  
  return metadata
}

/**
 * Extract product-level metadata from parent row
 */
export function extractProductMetadata(row: CSVRow, parentSKU: string, sellerId: string): Record<string, any> {
  const metadata: Record<string, any> = {
    parent_sku: parentSKU,
    product_type: row[CSVColumn.PRODUCT_TYPE],
    seller_id: sellerId,
    imported_at: new Date().toISOString(),
  }
  
  // Brand & Manufacturer
  if (row[CSVColumn.BRAND_NAME]) metadata.brand_name = row[CSVColumn.BRAND_NAME]
  if (row[CSVColumn.MANUFACTURER]) metadata.manufacturer = row[CSVColumn.MANUFACTURER]
  
  // Variation Theme (determines how to display variants)
  if (row[CSVColumn.VARIATION_THEME_NAME]) metadata.variation_theme = row[CSVColumn.VARIATION_THEME_NAME]
  
  // Unit Count Type (for calculator display)
  if (row[CSVColumn.UNIT_COUNT_TYPE]) metadata.unit_count_type = row[CSVColumn.UNIT_COUNT_TYPE]
  if (row[CSVColumn.UNIT_COUNT]) metadata.unit_count = row[CSVColumn.UNIT_COUNT]
  
  // Keywords & Bullet Points
  if (row[CSVColumn.BULLET_POINT]) metadata.bullet_point = row[CSVColumn.BULLET_POINT]
  if (row[CSVColumn.GENERIC_KEYWORD]) metadata.generic_keyword = row[CSVColumn.GENERIC_KEYWORD]
  
  // Special Features
  if (row[CSVColumn.SPECIAL_FEATURES]) metadata.special_features = row[CSVColumn.SPECIAL_FEATURES]
  
  // Restrictions
  if (row[CSVColumn.AGE_RESTRICTED]) metadata.age_restricted = row[CSVColumn.AGE_RESTRICTED]
  
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
  
  if (!group.parentRow[CSVColumn.ITEM_NAME] && !group.parentRow[CSVColumn.TITLE]) {
    errors.push('No product name found')
  }
  
  if (!group.parentRow[CSVColumn.PRODUCT_TYPE]) {
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

