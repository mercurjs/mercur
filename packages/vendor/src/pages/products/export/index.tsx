// Route: /products/export
import { Button, Heading, toast } from "@medusajs/ui"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { useTranslation } from "react-i18next"
import { ExportFilters } from "./export-filters"
import { useExportProducts } from "@hooks/api"
import { useProductTableQuery } from "@hooks/table/query"

export const Component = () => {
  const { t } = useTranslation()

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.export.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("products.export.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <ProductExportContent />
    </RouteDrawer>
  )
}

const ProductExportContent = () => {
  const { t } = useTranslation()
  const { searchParams } = useProductTableQuery({})
  const { mutateAsync } = useExportProducts(searchParams)
  const { handleSuccess } = useRouteModal()

  const handleExportRequest = async () => {
    await mutateAsync(
      {},
      {
        onSuccess: ({ url }) => {
          toast.info(t("products.export.success.title"))

          const link = document.createElement("a")
          link.href = url
          link.setAttribute("download", `products-export.csv`)
          document.body.appendChild(link)
          link.click()
          link.parentNode?.removeChild(link)

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <RouteDrawer.Body className="flex flex-1 flex-col overflow-hidden px-6 py-4">
      <ExportFilters />
      <RouteDrawer.Footer className="px-0">
        <Button onClick={handleExportRequest}>
          {t("products.export.action")}
        </Button>
      </RouteDrawer.Footer>
    </RouteDrawer.Body>
  )
}
