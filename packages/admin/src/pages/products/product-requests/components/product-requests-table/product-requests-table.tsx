import { Container } from "@medusajs/ui"
import { Children, ReactNode } from "react"

import { ProductRequestsDataTable } from "./product-requests-data-table"
import { ProductRequestsHeader } from "./product-requests-header"

export const ProductRequestsTable = ({ children }: { children?: ReactNode }) => (
  <Container className="divide-y p-0" data-testid="product-requests-table">
    {Children.count(children) > 0 ? (
      children
    ) : (
      <>
        <ProductRequestsHeader />
        <ProductRequestsDataTable />
      </>
    )}
  </Container>
)
