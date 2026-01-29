// Level 2: Kompozycja - modyfikujesz tylko wybrane części
// /core/* zawsze importuje z core-admin (bez override)
import { ProductsPage as CoreProductsPage } from '@mercurjs/core-admin/core/products'
import type { ProductsTableColumn } from '@mercurjs/core-admin/core/products'

// Własny komponent filtra vendorów
function VendorFilter() {
  return (
    <select className="border rounded px-2 py-1 text-sm">
      <option value="">All vendors</option>
      <option value="v1">Vendor 1</option>
      <option value="v2">Vendor 2</option>
    </select>
  )
}

// Definicja kolumn z pełnym typowaniem
const columns: ProductsTableColumn[] = [
  { key: 'title', label: 'Product Name' },
  { key: 'status', label: 'Status' },
  {
    key: 'vendor',
    label: 'Vendor',
    render: () => <span className="text-blue-600">Acme Inc</span>,
  },
]

// Default export dla file-based routing
export default function ProductsPage() {
  return (
    <CoreProductsPage>
      <CoreProductsPage.Header title="My Custom Products">
        <VendorFilter />
        <CoreProductsPage.Actions />
      </CoreProductsPage.Header>

      <CoreProductsPage.Table columns={columns} />
    </CoreProductsPage>
  )
}
