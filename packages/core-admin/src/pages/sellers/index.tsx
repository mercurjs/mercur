// Route: /sellers
// Sellers list page

import { SellersListTable } from "./_components/sellers-list-table"

// Re-export for user overrides
export { SellersListTable }

export const Component = () => {
  return <SellersListTable />
}
