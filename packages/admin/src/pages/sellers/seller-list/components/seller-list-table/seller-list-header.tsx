import { ReactNode } from "react"
import { Heading } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"

export const SellerListTitle = () => {
  return (
    <div>
      <Heading level="h2">Sellers</Heading>
    </div>
  )
}

export const SellerListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">{children}</div>
  )
}

const HEADER_ALLOWED_TYPES = [SellerListTitle, SellerListActions] as const

export const SellerListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {hasExplicitCompoundComposition(children, HEADER_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <SellerListTitle />
          <SellerListActions />
        </>
      )}
    </div>
  )
}
