/**
 * Level 2 Example: Composition
 *
 * This example shows how to customize the ProductsPage using composition.
 * Place this file at: apps/admin/src/pages/products/index.tsx
 *
 * The ?core suffix ensures we import from the core package even when
 * the override plugin is active.
 */

// Import from core with ?core suffix to bypass override
import { ProductsPage } from '@mercurjs/core-admin/pages/products?core'

// Custom vendor filter component
function VendorFilter() {
  return (
    <select className="border rounded px-2 py-1">
      <option value="">All vendors</option>
      <option value="v1">Vendor 1</option>
      <option value="v2">Vendor 2</option>
    </select>
  )
}

// Custom column for vendor info
const vendorColumn = {
  key: 'vendor',
  label: 'Vendor',
  render: () => <span className="text-blue-600">Vendor X</span>,
}

export default function CustomProductsPage() {
  return (
    <ProductsPage>
      {/* Custom header with vendor filter */}
      <ProductsPage.Header title="My Products">
        <VendorFilter />
        <ProductsPage.Actions />
      </ProductsPage.Header>

      {/* Custom table with additional vendor column */}
      <ProductsPage.Table
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status' },
          vendorColumn,
        ]}
      />
    </ProductsPage>
  )
}
