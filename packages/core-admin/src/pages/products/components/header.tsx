import type { ProductsHeaderProps } from '../types'

export function ProductsHeader({ title = 'Products', children }: ProductsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-x-2">{children}</div>
    </div>
  )
}
