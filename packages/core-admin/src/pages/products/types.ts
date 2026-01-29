import { ReactNode } from 'react'

// ============================================
// Product Types
// ============================================

export interface Product {
  id: string
  title: string
  handle: string
  status: string
  thumbnail?: string
  [key: string]: unknown // Allow additional properties
}

// ============================================
// Context Types
// ============================================

export interface ProductsPageContextValue {
  products: Product[]
  isLoading: boolean
  error: Error | null
  search: string
  setSearch: (search: string) => void
}

// ============================================
// Component Props Types
// ============================================

export interface ProductsPageProps {
  children?: ReactNode
}

export interface ProductsHeaderProps {
  /** Custom title for the header */
  title?: string
  /** Action buttons or other elements to render on the right side */
  children?: ReactNode
}

export interface ProductsTableColumn {
  /** Unique key for the column, should match Product property name */
  key: string
  /** Display label for the column header */
  label: string
  /** Custom render function for cell content */
  render?: (product: Product) => ReactNode
}

export interface ProductsTableProps {
  /** Column definitions - defaults to title, handle, status */
  columns?: ProductsTableColumn[]
  /** Optional children to render above the table (e.g., filters) */
  children?: ReactNode
}

export interface ProductsActionsProps {
  /** Custom action buttons - if provided, replaces default actions */
  children?: ReactNode
}

// ============================================
// Compound Component Type
// ============================================

export interface ProductsPageComponent {
  (props: ProductsPageProps): ReactNode
  /** Header section with title and actions */
  Header: React.FC<ProductsHeaderProps>
  /** Data table with customizable columns */
  Table: React.FC<ProductsTableProps>
  /** Action buttons (Export, Import, Create) */
  Actions: React.FC<ProductsActionsProps>
  /** Hook to access page context (products, loading state, etc.) */
  useContext: () => ProductsPageContextValue
}
