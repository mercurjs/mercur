import { ReactNode } from "react"
import { Button } from "@medusajs/ui"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

/**
 * Hook to get product action handlers
 * Use this to create custom action buttons with the same behavior
 */
export function useProductsActions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  return {
    /** Navigate to create product page */
    goToCreate: () => navigate("create"),
    /** Navigate to export page */
    goToExport: () => navigate(`export${location.search}`),
    /** Navigate to import page */
    goToImport: () => navigate(`import${location.search}`),
    /** Links for use with <Link> or asChild */
    links: {
      create: "create",
      export: `export${location.search}`,
      import: `import${location.search}`,
    },
    /** Translated labels */
    labels: {
      create: t("actions.create"),
      export: t("actions.export"),
      import: t("actions.import"),
    },
  }
}

export interface ProductsActionsProps {
  /** Replace default actions with custom content */
  children?: ReactNode
  /** Hide export button */
  hideExport?: boolean
  /** Hide import button */
  hideImport?: boolean
  /** Hide create button */
  hideCreate?: boolean
}

export function ProductsActions({
  children,
  hideExport,
  hideImport,
  hideCreate,
}: ProductsActionsProps) {
  const { t } = useTranslation()
  const location = useLocation()

  // If children provided, render them instead of defaults
  if (children) {
    return <>{children}</>
  }

  return (
    <>
      {!hideExport && (
        <Button size="small" variant="secondary" asChild data-testid="products-export-button">
          <Link to={`export${location.search}`} data-testid="products-export-link">
            {t("actions.export")}
          </Link>
        </Button>
      )}
      {!hideImport && (
        <Button size="small" variant="secondary" asChild data-testid="products-import-button">
          <Link to={`import${location.search}`} data-testid="products-import-link">
            {t("actions.import")}
          </Link>
        </Button>
      )}
      {!hideCreate && (
        <Button size="small" variant="secondary" asChild data-testid="products-create-button">
          <Link to="create" data-testid="products-create-link">
            {t("actions.create")}
          </Link>
        </Button>
      )}
    </>
  )
}
