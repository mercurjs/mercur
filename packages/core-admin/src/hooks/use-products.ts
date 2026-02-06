import { useState, useEffect } from 'react'

export interface Product {
  id: string
  title: string
  handle: string
  status: string
  thumbnail?: string
}

interface UseProductsOptions {
  initialData?: Product[]
}

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(options.initialData || [])
  const [isLoading, setIsLoading] = useState(!options.initialData)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In POC, we use mock data
      // In real implementation, this would call the Medusa API
      await new Promise(resolve => setTimeout(resolve, 500))

      setProducts([
        { id: '1', title: 'Product 1', handle: 'product-1', status: 'published' },
        { id: '2', title: 'Product 2', handle: 'product-2', status: 'draft' },
        { id: '3', title: 'Product 3', handle: 'product-3', status: 'published' },
      ])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!options.initialData) {
      fetchProducts()
    }
  }, [])

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  }
}
