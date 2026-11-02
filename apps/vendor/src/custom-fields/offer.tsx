import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk";
import { createFormHelper } from "@mercurjs/dashboard-shared";
import { Badge, Input, Text } from "@medusajs/ui";

type VariantRow = {
  variant: { title?: string | null };
  offer?: { sku?: string | null; metadata?: Record<string, unknown> | null };
};

type CatalogueRow = { handle?: string | null };

type InventoryRow = { sku?: string | null; required_quantity?: number | null };

const form = createFormHelper<unknown>();

export default defineCustomFieldsConfig({
  model: "offer",
  list: [
    // Offer detail → variants table
    {
      zone: "variants",
      columns: [
        // REPLACE the built-in sku column
        {
          id: "sku",
          header: "SKU (custom)",
          component: ({ row }) => (
            <Badge size="2xsmall" color="blue">
              {(row as VariantRow).offer?.sku ?? "-"}
            </Badge>
          ),
        },
        // ADD a column
        {
          id: "warranty",
          header: "Warranty",
          component: ({ row }) => {
            const months = (row as VariantRow).offer?.metadata?.warranty_months;
            return <Text size="small">{months ? `${months} mo` : "-"}</Text>;
          },
        },
      ],
      viewDefaults: {
        // HIDE the built-in inventory column
        columnVisibility: { inventory: false },
      },
    },
    // Offer detail → inventory items table
    {
      zone: "inventory",
      columns: [
        {
          id: "required_quantity",
          header: "Qty needed",
          component: ({ row }) => (
            <Text size="small" weight="plus">
              × {(row as InventoryRow).required_quantity ?? 0}
            </Text>
          ),
        },
        {
          id: "sku_length",
          header: "SKU length",
          component: ({ row }) => (
            <Text size="small">{(row as InventoryRow).sku?.length ?? 0}</Text>
          ),
        },
      ],
    },
    // Create offer → catalogue picker
    {
      zone: "create-catalogue",
      columns: [
        {
          id: "handle",
          header: "Handle",
          component: ({ row }) => (
            <Text size="small" className="text-ui-fg-subtle">
              /{(row as CatalogueRow).handle}
            </Text>
          ),
        },
      ],
      viewDefaults: { columnVisibility: { collection: false } },
    },
  ],
  forms: [
    // Edit offer drawer
    {
      zone: "edit",
      fields: {
        // HIDE a built-in field
        leadtime_to_ship: null,
        // REPLACE a built-in field (still saves to `sku`)
        sku: {
          validation: form.string(),
          label: "SKU (custom input)",
          component: ({ field }) => (
            <Input
              value={(field?.value as string) ?? ""}
              onChange={(e) => field?.onChange(e.target.value.toUpperCase())}
              onBlur={field?.onBlur}
              placeholder="Uppercased automatically"
            />
          ),
        },
        // ADD a field (sent as additional_data.internal_note)
        internal_note: {
          validation: form.string().optional(),
          label: "Internal note",
          placeholder: "Only visible to your team",
        },
      },
    },
    // Create offer → stock levels & prices spreadsheet
    {
      zone: "create",
      tab: "stockLevelsAndPrices",
      fields: {
        // HIDE a built-in grid column
        condition: null,
        // ADD editable columns, saved per offer in additional_data
        warranty_months: {
          validation: form.number().optional(),
          label: "Warranty (months)",
          type: "number",
        },
        eco_label: {
          validation: form.boolean().optional(),
          label: "Eco label",
          type: "boolean",
          defaultValue: false,
        },
        packaging: {
          validation: form.string().optional(),
          label: "Packaging",
          type: "select",
          options: [
            { label: "Standard", value: "standard" },
            { label: "Gift", value: "gift" },
            { label: "Plastic free", value: "plastic_free" },
          ],
        },
      },
    },
    // Edit prices spreadsheet: added column is sent with the update
    {
      zone: "edit-price",
      fields: {
        price_note: {
          validation: form.string().optional(),
          label: "Price note",
          type: "text",
        },
      },
    },
    // Edit stock spreadsheet: overrides only
    {
      zone: "edit-stock",
      fields: { sku: null },
    },
  ],
});
