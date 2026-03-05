import { Children, ReactNode } from "react"

import { RouteFocusModal } from "../../../components/modals"
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form"
import { useStockLocations } from "../../../hooks/api"
import {
  InventoryCreateForm,
  CreateInventoryItemSchemaType,
} from "./components/inventory-create-form"
import { InventoryCreateDetailsTab } from "./components/inventory-create-form/inventory-create-details-tab"
import { InventoryAvailabilityForm } from "./components/inventory-create-form/inventory-availability-form"
import { CreateInventoryItemSchema } from "./components/inventory-create-form/schema"

const Root = ({ children }: { children?: ReactNode }) => {
  const { isPending, stock_locations, isError, error } = useStockLocations({
    limit: 9999,
    fields: "id,name",
  })

  const ready = !isPending && !!stock_locations

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {ready && (
        Children.count(children) > 0 ? (
          children
        ) : (
          <InventoryCreateForm locations={stock_locations} />
        )
      )}
    </RouteFocusModal>
  )
}

export const InventoryCreatePage = Object.assign(Root, {
  Form: InventoryCreateForm,
  DetailsTab: InventoryCreateDetailsTab,
  AvailabilityTab: InventoryAvailabilityForm,
  Tab: TabbedForm.Tab,
})

export type { CreateInventoryItemSchemaType }
export { CreateInventoryItemSchema }

// Keep backward-compatible named export for route `Component`
export const InventoryCreate = Root
