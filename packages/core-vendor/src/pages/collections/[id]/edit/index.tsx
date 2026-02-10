// Route: /collections/:id/edit
import { Heading } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "@components/modals"
import { useCollection } from "@hooks/api/collections"
import { EditCollectionForm } from "./edit-collection-form"

export const Component = () => {
  const { id } = useParams()
  const { product_collection, isPending, isError, error } = useCollection(id!)

  const ready = !isPending && !!product_collection

  if (isError) throw error

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>Edit Collection</Heading>
      </RouteDrawer.Header>
      {ready && <EditCollectionForm collection={product_collection} />}
    </RouteDrawer>
  )
}
