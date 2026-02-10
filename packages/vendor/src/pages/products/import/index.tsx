// Route: /products/import
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { useTranslation } from "react-i18next"
import { useMemo, useState } from "react"
import { useImportProducts } from "@hooks/api"
import { UploadImport } from "./upload-import"
import { ImportSummary } from "./import-summary"
import { Trash } from "@medusajs/icons"
import { FilePreview } from "@components/common/file-preview"
import { getProductImportCsvTemplate } from "./helpers/import-template"

export const Component = () => {
  const { t } = useTranslation()

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.import.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("products.import.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <ProductImportContent />
    </RouteDrawer>
  )
}

const ProductImportContent = () => {
  const { t } = useTranslation()
  const [filename, setFilename] = useState<string>()

  const { mutateAsync: importProducts, isPending, data } = useImportProducts()
  const { handleSuccess } = useRouteModal()

  const summary = useMemo(() => data?.summary, [data])

  const handleUploaded = async (file: File) => {
    setFilename(file.name)
    await importProducts({ file })
  }

  const handleConfirm = async () => {
    handleSuccess()
    toast.success(t("products.import.success.title"), {
      description: t("products.import.success.description"),
    })
  }

  const handleClear = () => {
    setFilename(undefined)
  }

  const csvTemplate = useMemo(() => getProductImportCsvTemplate(), [])

  return (
    <RouteDrawer.Body className="px-6 py-4">
      {!filename && (
        <div className="flex flex-col gap-y-4">
          <UploadImport onUploaded={handleUploaded} />
          <div className="bg-ui-bg-subtle flex items-center gap-x-3 rounded-xl p-4">
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus">
                {t("products.import.template.title")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t("products.import.template.description")}
              </Text>
            </div>
            <div className="flex-1" />
            <Button variant="secondary" asChild>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`}
                download="product-import-template.csv"
              >
                {t("actions.download")}
              </a>
            </Button>
          </div>
        </div>
      )}

      {filename && (
        <div className="flex flex-col gap-y-4">
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-xl p-4">
            <div className="flex items-center gap-x-3">
              <FilePreview filename={filename} loading={isPending} />
              <div className="flex-1" />
              <Button
                variant="secondary"
                onClick={handleClear}
                disabled={isPending}
              >
                <Trash />
                {t("actions.delete")}
              </Button>
            </div>
          </div>

          {summary && <ImportSummary summary={summary} />}

          <div className="flex justify-end">
            <Button onClick={handleConfirm} disabled={isPending}>
              {t("actions.import")}
            </Button>
          </div>
        </div>
      )}
    </RouteDrawer.Body>
  )
}
