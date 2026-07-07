import "@mercurjs/vendor/extension-targets"
import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk"
import { createFormHelper } from "@mercurjs/dashboard-shared"
import { Text } from "@medusajs/ui"

type ProductWithMeta = { metadata?: Record<string, unknown> }

const form = createFormHelper<ProductWithMeta>()

const erpId = (data: unknown) =>
  ((data as ProductWithMeta)?.metadata?.erp_id as string) ?? "-"

export default defineCustomFieldsConfig({
  model: "product",
  link: "brand",
  forms: [
    {
      zone: "edit",
      fields: {
        erp_id: form.define({
          validation: form.string().optional(),
          label: "ERP ID",
          description: "External system identifier",
          placeholder: "ERP-000",
          defaultValue: (data) =>
            ((data as ProductWithMeta)?.metadata?.erp_id as string) ?? "",
        }),
      },
    },
  ],
  displays: [
    {
      zone: "general",
      fields: [
        {
          id: "erp_id",
          component: ({ data }) => (
            <Text size="small" className="text-ui-fg-subtle px-6 py-4">
              ERP ID: {erpId(data)}
            </Text>
          ),
        },
      ],
    },
  ],
  list: {
    columns: [{ id: "erp_id", header: "ERP", component: ({ row }) => erpId(row) }],
  },
})
