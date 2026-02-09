import { ReactNode } from "react"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export interface ProductsHeaderProps {
  /** Custom title - defaults to translated "Products" */
  title?: string
  /** Children rendered on the right side (usually Actions) */
  children?: ReactNode
}

export function ProductsHeader({ title, children }: ProductsHeaderProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="products-list-header"
    >
      <Heading level="h2" data-testid="products-list-title">
        {title ?? t("products.domain")}
      </Heading>
      <div
        className="flex items-center justify-center gap-x-2"
        data-testid="products-list-actions"
      >
        {children}
      </div>
    </div>
  )
}
