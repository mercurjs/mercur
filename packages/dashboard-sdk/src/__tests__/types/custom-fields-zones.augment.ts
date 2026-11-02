import type { CustomFieldsConfig } from "@mercurjs/dashboard-sdk"

declare module "@mercurjs/dashboard-sdk" {
  interface CustomFieldsRegistry {
    offer: {
      formZones: "create" | "edit"
      formTabs: { create: "catalogue" | "stockLevelsAndPrices" }
      formFieldIds: "sku" | "leadtime_to_ship"
      displayZones: "variants"
      displayFieldIds: "title"
      listZones: "list" | "variants"
      listColumnIds: "sku" | "inventory"
    }
  }
}

const Cell = () => null

const config: CustomFieldsConfig<"offer"> = {
  model: "offer",
  list: [
    { columns: [{ id: "warranty", header: "Warranty", component: Cell }] },
    {
      zone: "variants",
      columns: [{ id: "sku", component: Cell }],
      viewDefaults: { columnVisibility: { inventory: false } },
    },
  ],
  forms: [
    { zone: "edit", fields: { leadtime_to_ship: null } },
    {
      zone: "create",
      tab: "stockLevelsAndPrices",
      fields: { warranty_months: { validation: {}, type: "number" } },
    },
  ],
}

const singleList: CustomFieldsConfig<"offer"> = {
  model: "offer",
  list: { columns: [{ id: "sku", component: Cell }] },
}

const unknownZone: CustomFieldsConfig<"offer"> = {
  model: "offer",
  // @ts-expect-error list zones are limited to the scanned tables
  list: { zone: "not-a-table" },
}

export { config, singleList, unknownZone }
