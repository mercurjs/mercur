import { Button, Heading, Text, toast } from "@medusajs/ui"

import { RouteDrawer, useRouteModal } from "@mercurjs/dashboard-shared"
import { useExportProducts } from "../../../hooks/api/product-import-export"

function ExportProductsContent() {
  const { handleSuccess } = useRouteModal()

  const { mutateAsync: exportProducts, isPending } = useExportProducts({
    onSuccess: (data) => {
      if (data.url) {
        const a = document.createElement("a")
        a.href = data.url
        a.download = `products-export-${Date.now()}.csv`
        a.click()
      }
      toast.success("Products exported successfully.")
      handleSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleExport = async () => {
    await exportProducts()
  }

  return (
    <>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Export Products</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description>
          Export your products as a CSV file.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        <div className="flex flex-col gap-y-4">
          <Text className="text-ui-fg-subtle">
            This will export all your products to a CSV file. The download will
            start automatically when the export is ready.
          </Text>
        </div>
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <RouteDrawer.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </RouteDrawer.Close>
        <Button onClick={handleExport} isLoading={isPending}>
          Export
        </Button>
      </RouteDrawer.Footer>
    </>
  )
}

export default function ProductExportPage() {
  return (
    <RouteDrawer>
      <ExportProductsContent />
    </RouteDrawer>
  )
}
