// Route: /sellers
// Sellers list page

import { SellersListTable } from "./_components/sellers-list-table"

// Re-export for user overrides
export { SellersListTable }

export const nav = {
  id: "sellers",
  label: "Sellers",
  iconKey: "users",
  section: "customers",
  order: 50,
}

export const Component = () => {
  return <SellersListTable />
}
