import { useProductsPageContext } from '../context'
import type { Product, ProductsTableProps, ProductsTableColumn } from '../types'

const defaultColumns: ProductsTableColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  { key: 'status', label: 'Status' },
]

export function ProductsTable({ columns = defaultColumns, children }: ProductsTableProps) {
  const { products, isLoading } = useProductsPageContext()

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {children}
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(product) : (product[col.key as keyof Product] as string)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
