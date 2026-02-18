import { useState } from "react"
import { Button, Heading } from "@medusajs/ui"

import { RouteDrawer } from "@mercurjs/dashboard-shared"
import { UploadImport } from "./_components/upload-import"
import { ImportSummary } from "./_components/import-summary"

export default function ProductImportPage() {
  const [summary, setSummary] = useState<{ created: number } | null>(null)

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Import Products</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description>
          Upload a CSV file to import products into your store.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        {summary ? (
          <ImportSummary created={summary.created} />
        ) : (
          <UploadImport onSuccess={setSummary} />
        )}
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <RouteDrawer.Close asChild>
          <Button variant="secondary">
            {summary ? "Done" : "Cancel"}
          </Button>
        </RouteDrawer.Close>
      </RouteDrawer.Footer>
    </RouteDrawer>
  )
}
