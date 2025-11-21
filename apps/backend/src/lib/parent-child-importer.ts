/**
 * Parent/Child Product Importer
 * 
 * Imports products from CSV following Parent/Child structure:
 * - One Parent SKU = One Product
 * - Child SKUs = Variants of that product
 * 
 * @see Instructions in user documentation
 */

import { Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import type { ParentGroup, CSVRow } from './csv-parser'
import { 
  extractPrice, 
  extractQuantity, 
  extractImages,
  extractVariantMetadata,
  extractProductMetadata
} from './csv-parser'
import { getCategoryForProductType } from './category-mapping'

interface ImportContext {
  sellerId: string
  stockLocationId: string
  salesChannelId: string
  regionId: string
}

/**
 * Import a single parent group (product with variants)
 */
export async function importParentGroup(
  group: ParentGroup,
  context: ImportContext,
  scope: any
): Promise<{
  success: boolean
  productId?: string
  error?: string
}> {
  try {
    const { parentRow, childRows, parentSKU } = group
    const { sellerId, stockLocationId, salesChannelId, regionId } = context

    // 1. Get Product Module
    const productModule = scope.resolve(Modules.PRODUCT)

    // 2. Determine product name and description
    const productTitle = parentRow['Item Name'] || parentRow['Title'] || `Product ${parentSKU}`
    const productDescription = parentRow['Product Description'] || ''

    // 3. Get category mapping for this product type
    const productType = parentRow['Product Type']
    const categoryMapping = getCategoryForProductType(productType)

    if (!categoryMapping) {
      return {
        success: false,
        error: `No category mapping for product type: ${productType}`
      }
    }

    // 4. Find the leaf category (level 3)
    const categories = await productModule.listProductCategories({
      name: categoryMapping.level3
    })

    if (!categories || categories.length === 0) {
      return {
        success: false,
        error: `Category not found: ${categoryMapping.level3}`
      }
    }

    const leafCategory = categories[0]

    // 4b. Find product type ID
    let productTypeId: string | undefined
    if (productType) {
      const productTypes = await productModule.listProductTypes({
        value: productType
      })
      if (productTypes && productTypes.length > 0) {
        productTypeId = productTypes[0].id
      }
    }

    // 5. Prepare product images (Main + Image 2-9)
    const imageUrls = extractImages(parentRow)
    const images: { url: string }[] = imageUrls.map(url => ({ url }))

    // 6. Read Variation Theme Name to determine how to create options
    const variationTheme = (parentRow['Variation Theme Name'] || '').toUpperCase()
    
    // Determine what attributes to use based on variation theme
    const useColor = variationTheme.includes('COLOR')
    const useSize = variationTheme.includes('SIZE')
    const useStyle = variationTheme.includes('STYLE')
    const useQuantity = variationTheme.includes('ITEM_PACKAGE_QUANTITY')
    
    // 7. Extract unique values based on variation theme
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const styles = new Set<string>()
    const quantities = new Set<string>()
    
    childRows.forEach(row => {
      if (useColor && row['Colour']) colors.add(row['Colour'])
      if (useSize && row['Size']) sizes.add(row['Size'])
      if (useStyle && row['Size']) styles.add(row['Size']) // STYLE/SIZE uses Size field
      if (useQuantity && row['Unit Count']) quantities.add(row['Unit Count'])
    })

    // Extract unit count type from parent row or first child row
    const unitCountType = parentRow['Unit Count Type'] || childRows[0]?.['Unit Count Type'] || ''

    // 8. Create variants from child rows
    const variants = childRows.map((childRow, index) => {
      const sku = childRow['SKU']
      const price = extractPrice(childRow)
      const quantity = extractQuantity(childRow)
      
      // Extract attributes based on variation theme
      const color = useColor ? (childRow['Colour'] || '') : ''
      const size = useSize ? (childRow['Size'] || '') : ''
      const style = useStyle ? (childRow['Size'] || '') : '' // STYLE/SIZE → Size field
      const quantityValue = useQuantity ? (childRow['Unit Count'] || '') : ''
      
      const unitCount = childRow['Unit Count'] || ''
      const unitCountType = childRow['Unit Count Type'] || ''

      // Build variant title based on variation theme
      let variantTitle = productTitle
      const titleParts = [sku]
      
      if (color) titleParts.push(color)
      if (size) titleParts.push(size)
      if (style && !size) titleParts.push(style)
      if (quantityValue) titleParts.push(quantityValue)
      
      if (titleParts.length > 1) {
        variantTitle = titleParts.join(' - ')
      } else {
        variantTitle = `${productTitle} - ${sku}`
      }

      // Build options object based on variation theme
      const options: Record<string, string> = {}
      if (color) options['Color'] = color
      if (size) options['Size'] = size
      if (style && !size) options['Style'] = style
      if (quantityValue) options['Quantity'] = quantityValue
      
      // Fallback: if no options, use SKU as option
      if (Object.keys(options).length === 0) {
        options['Variant'] = sku
      }

      // Extract all variant metadata using helper function
      const metadata = extractVariantMetadata(childRow)

      return {
        title: variantTitle,
        sku,
        manage_inventory: true,
        allow_backorder: false,
        prices: [
          {
            amount: price,
            currency_code: 'gbp'
          }
        ],
        options,
        metadata
      }
    })

    if (variants.length === 0) {
      return {
        success: false,
        error: 'No variants to create'
      }
    }

    // 7. Generate readable handle from product title
    const generateHandle = (title: string, sku: string): string => {
      let handle = title
        .toLowerCase()
        .replace(/\|/g, ' ') // Replace pipes with spaces first
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .substring(0, 200) // Limit length
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens AFTER substring
      
      // Ensure we don't have an empty handle
      if (!handle || handle === '') {
        handle = `product-${sku.toLowerCase()}`
      }
      
      return handle
    }
    
    const handle = generateHandle(productTitle, parentSKU)

    // 9. Build product options based on variation theme
    const productOptions: Array<{ title: string; values: string[] }> = []
    
    if (useColor && colors.size > 0) {
      productOptions.push({
        title: 'Color',
        values: Array.from(colors)
      })
    }
    
    if (useSize && sizes.size > 0) {
      productOptions.push({
        title: 'Size',
        values: Array.from(sizes)
      })
    }
    
    if (useStyle && styles.size > 0) {
      productOptions.push({
        title: 'Style',
        values: Array.from(styles)
      })
    }
    
    if (useQuantity && quantities.size > 0) {
      productOptions.push({
        title: 'Quantity',
        values: Array.from(quantities)
      })
    }
    
    // Fallback: if no options based on variation theme, use SKU as option
    if (productOptions.length === 0) {
      productOptions.push({
        title: 'Variant',
        values: childRows.map(row => row['SKU'])
      })
    }

    // 9. Create product with variants using workflow
    const { result } = await createProductsWorkflow(scope).run({
      input: {
        products: [
          {
            title: productTitle,
            description: productDescription,
            status: 'published',
            is_giftcard: false,
            discountable: true,
            handle,
            images,
            category_ids: [leafCategory.id],
            type_id: productTypeId, // Add product type ID
            options: productOptions,
            variants,
            metadata: extractProductMetadata(parentRow, parentSKU, sellerId),
            sales_channels: [{ id: salesChannelId }]
          }
        ]
      }
    })

    const product = result[0]
    const productId = product.id

    // 8. Link product to seller (using direct DB insert into join table)
    try {
      const { ContainerRegistrationKeys, generateEntityId } = await import('@medusajs/framework/utils')
      const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

      const linkId = generateEntityId('', 'seller_product')
      await knex('seller_seller_product_product').insert({
        id: linkId,
        seller_id: sellerId,
        product_id: productId,
        created_at: new Date(),
        updated_at: new Date()
      })
    } catch (linkError: any) {
      // Link error - non-fatal
    }

    // 9. Create inventory items for each variant
    const inventoryModule = scope.resolve(Modules.INVENTORY)

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i]
      const childRow = childRows[i]
      const quantity = extractQuantity(childRow)

      try {
        // Check if inventory item already exists for this variant
        const existingItems = await inventoryModule.listInventoryItems({
          sku: variant.sku
        })

        let inventoryItemId: string

        if (existingItems && existingItems.length > 0) {
          inventoryItemId = existingItems[0].id
        } else {
          // Create inventory item
          const inventoryItems = await inventoryModule.createInventoryItems([
            {
              sku: variant.sku,
              title: variant.title
            }
          ])
          inventoryItemId = inventoryItems[0].id
        }

        // Link inventory item to seller
        try {
          const { ContainerRegistrationKeys, generateEntityId } = await import('@medusajs/framework/utils')
          const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
          
          // Check if link already exists
          const existing = await knex('seller_seller_inventory_inventory_item')
            .where({
              seller_id: sellerId,
              inventory_item_id: inventoryItemId
            })
            .whereNull('deleted_at')
            .first()

          if (!existing) {
            const linkId = generateEntityId('', 'seller_inventory')
            await knex('seller_seller_inventory_inventory_item').insert({
              id: linkId,
              seller_id: sellerId,
              inventory_item_id: inventoryItemId,
              created_at: new Date(),
              updated_at: new Date()
            })
          }
        } catch (linkError: any) {
          // Link error - non-fatal
        }

        // Link inventory item to variant
        const remoteLink = scope.resolve('remoteLink')
        await remoteLink.create({
          [Modules.PRODUCT]: {
            variant_id: variant.id
          },
          [Modules.INVENTORY]: {
            inventory_item_id: inventoryItemId
          }
        })

        // Create inventory level at stock location
        const existingLevels = await inventoryModule.listInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: stockLocationId
        })

        if (!existingLevels || existingLevels.length === 0) {
          await inventoryModule.createInventoryLevels([
            {
              inventory_item_id: inventoryItemId,
              location_id: stockLocationId,
              stocked_quantity: quantity
            }
          ])
        }
      } catch (invError: any) {
        // Inventory error - non-fatal
      }
    }

    return {
      success: true,
      productId
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Import multiple parent groups
 */
export async function importParentGroups(
  groups: ParentGroup[],
  context: ImportContext,
  scope: any
): Promise<{
  total: number
  success: number
  failed: number
  errors: Array<{ parentSKU: string; error: string }>
}> {
  const results = {
    total: groups.length,
    success: 0,
    failed: 0,
    errors: [] as Array<{ parentSKU: string; error: string }>
  }

  for (const group of groups) {
    const result = await importParentGroup(group, context, scope)

    if (result.success) {
      results.success++
    } else {
      results.failed++
      results.errors.push({
        parentSKU: group.parentSKU,
        error: result.error || 'Unknown error'
      })
    }
  }

  return results
}

