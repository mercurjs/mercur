import { Container } from "@medusajs/ui"
import { Children, ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { OfferListDataTable } from "./offer-list-data-table"
import { OfferListHeader } from "./offer-list-header"

export const OfferListTable = ({ children }: { children?: ReactNode }) => (
  <Container className="divide-y p-0" data-testid="offer-list-table">
    {Children.count(children) > 0 ? (
      children
    ) : (
      <>
        <OfferListHeader />
        <OfferListDataTable />
      </>
    )}
    <Outlet />
  </Container>
)
