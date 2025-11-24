import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MedusaError, Modules } from '@medusajs/framework/utils'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/b2c-core/modules/seller'
import csvParser from 'csv-parser'
import { Readable } from 'stream'
import { groupByParentSKU, validateParentGroup, type CSVRow } from '../../../../lib/csv-parser'
import { importParentGroups } from '../../../../lib/parent-child-importer'

/**
 * POST /vendor/products/import
 * 
 * Import products from CSV file (Parent/Child structure)
 * 
 * Expected CSV columns (from CSVRow):
 * 
 * Core Fields:
 * - Status: Product status (active/inactive)
 * - Title: Product name
 * - SKU: Unique variant SKU
 * - Item Name: Alternative product name
 * - Product Description: Full description
 * - Bullet Point: Short description/features
 * - Product Type: Type for category mapping
 * - Sell Price: Price in GBP
 * - Quantity (UK): Stock quantity
 * 
 * Parent/Child Structure:
 * - Parentage Level: "Parent" | "Child" | ""
 * - Parent SKU: SKU of parent product (for child variants)
 * - Child Relation: Relationship to parent
 * - Variation Theme Name: Theme for variations (e.g., "SizeColor")
 * 
 * Variants:
 * - Colour: Color variant
 * - Size: Size variant
 * 
 * Images:
 * - Main Image URL: Primary product image
 * - Image 2 through Image 9: Additional images
 * 
 * Product Details:
 * - Brand Name: Product brand
 * - Manufacturer: Manufacturer name
 * - Product Id Type: ID type (EAN, UPC, etc.)
 * - Product Id: Product identifier
 * - Part Number: Manufacturer part number
 * 
 * Dimensions & Weight:
 * - Item Weight: Weight value
 * - Item Weight Unit: Weight unit (kg, g, lb)
 * - Item Length Longer Edge: Length value
 * - Item Length Unit: Length unit (m, cm, mm)
 * - Item Width Shorter Edge: Width value
 * - Item Width Unit: Width unit
 * - Item Thickness Decimal Value: Thickness
 * - Item Thickness Unit: Thickness unit
 * - Length Range: Range of lengths
 * - Width Range: Range of widths
 * 
 * Additional:
 * - Generic Keyword: Search keywords
 * - Special Features: Product features
 * - Unit Count: Number of units
 * - Unit Count Type: Type of unit count
 * - Age Restricted: Age restriction flag
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const actorId = req.auth_context?.actor_id

  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      'Authentication required'
    )
  }

  try {
    // 1. Get seller from actor_id (member)
    const sellerModule = req.scope.resolve<SellerModuleService>(SELLER_MODULE)
    
    // Fetch seller by actor_id - in b2c-core, actor_id is the member ID
    const query = req.scope.resolve('query')
    const { data: sellers } = await query.graph({
      entity: 'seller',
      fields: ['id', 'name'],
      filters: {
        members: {
          id: actorId
        }
      }
    })

    if (!sellers || sellers.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No seller found for member: ${actorId}`
      )
    }

    const sellerId = sellers[0].id

    // 2. Get file from request (uploaded by multer middleware)
    const file = (req as any).file

    if (!file) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No CSV file provided. Please upload a file.'
      )
    }

    // 3. Get seller's default stock location
    const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
    const stockLocations = await stockLocationModule.listStockLocations({
      name: { $ilike: `%${sellerId}%` }
    })

    if (!stockLocations || stockLocations.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Seller has no stock location. Please create one first.'
      )
    }

    const stockLocationId = stockLocations[0].id

    // 3. Get default sales channel
    const salesChannelModule = req.scope.resolve(Modules.SALES_CHANNEL)
    const salesChannels = await salesChannelModule.listSalesChannels({ is_disabled: false })
    
    if (!salesChannels || salesChannels.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No active sales channel found'
      )
    }

    const salesChannelId = salesChannels[0].id

    // 4. Get default region (GB)
    const regionModule = req.scope.resolve(Modules.REGION)
    const regions = await regionModule.listRegions({ currency_code: 'gbp' })

    if (!regions || regions.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No GBP region found'
      )
    }

    const regionId = regions[0].id

    // 5. Parse CSV file
    const rows: CSVRow[] = []
    const fileBuffer = file.buffer
    const stream = Readable.from(fileBuffer.toString('utf-8'))

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row: CSVRow) => {
          rows.push(row)
        })
        .on('end', () => {
          resolve()
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error)
          reject(error)
        })
    })

    // 6. Group by Parent SKU
    const groups = groupByParentSKU(rows)

    // 7. Validate groups
    const validGroups = groups.filter(group => {
      const validation = validateParentGroup(group)
      if (!validation.valid) {
        console.warn(`Skipping ${group.parentSKU}: ${validation.errors.join(', ')}`)
        return false
      }
      return true
    })

    if (validGroups.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No valid products found in CSV'
      )
    }

    // 8. Import products
    const importResults = await importParentGroups(
      validGroups,
      {
        sellerId,
        stockLocationId,
        salesChannelId,
        regionId
      },
      req.scope
    )

    // 9. Trigger Algolia reindex for imported products
    try {
      const { syncAlgoliaWorkflow } = await import('@mercurjs/algolia/workflows')
      await syncAlgoliaWorkflow.run({ container: req.scope })
    } catch (algoliaError: any) {
      console.warn('Algolia reindex failed (non-critical):', algoliaError.message)
    }

    // 10. Return results
    res.status(200).json({
      message: 'Import completed',
      results: importResults
    })
  } catch (error: any) {
    console.error('[Vendor Product Import] Error:', error)

    if (error.type) {
      throw error
    }

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error.message || 'Failed to import products'
    )
  }
}

