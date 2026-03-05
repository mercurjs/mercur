import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  DataGrid,
  createDataGridHelper,
} from "../../../../../components/data-grid"
import { useRouteModal } from "../../../../../components/modals"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { CreateInventoryItemSchema } from "./schema"

type InventoryAvailabilityFormProps = {
  locations: HttpTypes.AdminStockLocation[]
}

const Root = ({ locations }: InventoryAvailabilityFormProps) => {
  const form = useTabbedForm<CreateInventoryItemSchema>()
  const { setCloseOnEscape } = useRouteModal()

  const columns = useColumns()

  return (
    <div className="size-full" data-testid="inventory-create-form-availability">
      <DataGrid
        columns={columns}
        data={locations}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  )
}

const columnHelper = createDataGridHelper<
  HttpTypes.AdminStockLocation,
  CreateInventoryItemSchema
>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.column({
        id: "location",
        header: () => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">{t("locations.domain")}</span>
          </div>
        ),
        cell: (context) => {
          return (
            <DataGrid.ReadonlyCell context={context}>
              {context.row.original.name}
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "in-stock",
        name: t("fields.inStock"),
        header: t("fields.inStock"),
        field: (context) => `locations.${context.row.original.id}`,
        type: "number",
        cell: (context) => {
          return <DataGrid.NumberCell placeholder="0" context={context} />
        },
        disableHiding: true,
      }),
    ],
    [t]
  )
}

Root._tabMeta = defineTabMeta<CreateInventoryItemSchema>({
  id: "availability",
  labelKey: "inventory.create.availability",
  validationFields: ["locations"],
})

export const InventoryAvailabilityForm = Root
