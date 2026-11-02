import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk";
import { createFormHelper } from "@mercurjs/dashboard-shared";
import { Badge, Text } from "@medusajs/ui";

type ProductWithMeta = { metadata?: Record<string, unknown> };

type VariantRow = { sku?: string | null; updated_at?: string | Date | null };

const form = createFormHelper<ProductWithMeta>();

const erpId = (data: unknown) =>
  ((data as ProductWithMeta)?.metadata?.erp_id as string) ?? "-";

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
          defaultValue: (data: ProductWithMeta) =>
            (data?.metadata?.erp_id as string) ?? "",
        }),
      },
    },
  ],
  displays: [
    {
      zone: "general",
      fields: [
        // ADD — unknown id appends a new read-only row
        {
          id: "erp_id",
          component: ({ data }) => (
            <Text size="small" className="text-ui-fg-subtle px-6 py-4">
              ERP ID: {erpId(data)}
            </Text>
          ),
        },
        // REMOVE — built-in id + null hides the field
        { id: "subtitle", component: null },
        // REPLACE — built-in id + component overrides its render
        {
          id: "handle",
          component: ({ data }) => (
            <Text size="small" className="text-ui-fg-subtle px-6 py-4">
              /{(data as { handle?: string })?.handle}
            </Text>
          ),
        },
      ],
    },
  ],
  list: [
    {
      // ADD a column; OVERRIDE an existing column keyed by id
      columns: [
        { id: "erp_id", header: "ERP", component: ({ row }) => erpId(row) },
      ],
      viewDefaults: {
        columnVisibility: { collection: false }, // HIDE the built-in collection column
        columnOrder: ["product", "erp_id", "status"], // reorder
      },
    },
    // Product detail → variants table
    {
      zone: "variants",
      columns: [
        {
          id: "sku",
          header: "SKU (custom)",
          component: ({ row }) => (
            <Badge size="2xsmall" color="purple">
              {(row as VariantRow).sku ?? "-"}
            </Badge>
          ),
        },
        {
          id: "updated",
          header: "Updated",
          component: ({ row }) => {
            const updatedAt = (row as VariantRow).updated_at;
            return (
              <Text size="small" className="text-ui-fg-subtle">
                {updatedAt ? new Date(updatedAt).toLocaleDateString() : "-"}
              </Text>
            );
          },
        },
      ],
    },
  ],
});
