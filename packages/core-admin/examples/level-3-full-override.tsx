/**
 * Level 3 Example: Full Override
 *
 * This example shows a complete custom implementation that replaces
 * the core ProductsPage entirely.
 * Place this file at: apps/admin/src/pages/products/index.tsx
 */

import { useState, useEffect } from 'react'

interface Product {
  id: string
  title: string
  price: number
  vendor: string
}

export default function MyCustomProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    // Custom data fetching logic
    setProducts([
      { id: '1', title: 'Custom Product 1', price: 99.99, vendor: 'Acme Inc' },
      { id: '2', title: 'Custom Product 2', price: 149.99, vendor: 'Beta Corp' },
      { id: '3', title: 'Custom Product 3', price: 199.99, vendor: 'Gamma LLC' },
    ])
  }, [])

  return (
    <div className="my-custom-page">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Completely Custom Products</h1>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button
            className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </header>

      {view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-gray-600">{product.vendor}</p>
              <p className="text-xl font-bold mt-2">${product.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <span className="font-semibold">{product.title}</span>
                <span className="text-gray-500 ml-2">by {product.vendor}</span>
              </div>
              <span className="font-bold">${product.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
