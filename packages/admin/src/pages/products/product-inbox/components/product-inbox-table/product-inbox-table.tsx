import { Container } from "@medusajs/ui"
import { Children, ReactNode } from "react"

import { ProductInboxDataTable } from "./product-inbox-data-table"
import { ProductInboxHeader } from "./product-inbox-header"

export const ProductInboxTable = ({ children }: { children?: ReactNode }) => (
  <Container className="divide-y p-0" data-testid="product-inbox-table">
    {Children.count(children) > 0 ? (
      children
    ) : (
      <>
        <ProductInboxHeader />
        <ProductInboxDataTable />
      </>
    )}
  </Container>
)
