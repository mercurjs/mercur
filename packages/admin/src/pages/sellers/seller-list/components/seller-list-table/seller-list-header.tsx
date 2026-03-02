import { Children, ReactNode } from "react"
import { Heading } from "@medusajs/ui"

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

export const SellerListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
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
