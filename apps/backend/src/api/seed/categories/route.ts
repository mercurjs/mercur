import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'
import { createProductCategories, createProductTypes } from '../../../scripts/seed/seed-functions'

/**
 * POST /seed/categories
 * 
 * Public endpoint to seed product categories and product types
 * No authentication required
 * 
 * @returns Summary of created categories and product types
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const container = req.scope

    const results = {
      categories: null as any,
      productTypes: null as any,
      success: true,
      message: 'Categories and product types seeded successfully'
    }

    // 1. Create product categories
    console.log('Creating product categories...')
    results.categories = await createProductCategories(container)
    console.log(`✅ Created/verified ${results.categories.length} categories`)

    // 2. Create product types
    console.log('Creating product types...')
    results.productTypes = await createProductTypes(container)
    console.log(`✅ Created/verified ${results.productTypes.length} product types`)

    res.status(200).json({
      success: true,
      message: 'Seeding completed successfully',
      data: {
        categoriesCount: results.categories.length,
        productTypesCount: results.productTypes.length,
        categories: results.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          parent_category_id: c.parent_category_id
        })),
        productTypes: results.productTypes.map((pt: any) => ({
          id: pt.id,
          value: pt.value
        }))
      }
    })
  } catch (error: any) {
    console.error('[Seed Categories] Error:', error)

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error.message || 'Failed to seed categories and product types'
    )
  }
}

