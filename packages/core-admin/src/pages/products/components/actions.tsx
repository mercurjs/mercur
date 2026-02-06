import type { ProductsActionsProps } from '../types'

export function ProductsActions({ children }: ProductsActionsProps) {
  if (children) {
    return <>{children}</>
  }

  return (
    <>
      <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">Export</button>
      <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">Import</button>
      <button className="px-3 py-1.5 text-sm bg-black text-white rounded-md hover:bg-gray-800">
        Create Product
      </button>
    </>
  )
}
