import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk";
import { Badge, Text } from "@medusajs/ui";

type ProductRow = { handle?: string | null; status?: string | null };

export default defineCustomFieldsConfig({
  model: "collection",
  list: {
    // Collection detail → products table
    zone: "products",
    columns: [
      // REPLACE the built-in status column
      {
        id: "status",
        header: "Status (custom)",
        component: ({ row }) => (
          <Badge size="2xsmall" color="green">
            {(row as ProductRow).status ?? "-"}
          </Badge>
        ),
      },
      // ADD a column
      {
        id: "handle",
        header: "Handle",
        component: ({ row }) => (
          <Text size="small" className="text-ui-fg-subtle">
            /{(row as ProductRow).handle}
          </Text>
        ),
      },
    ],
    // HIDE built-in columns
    viewDefaults: { columnVisibility: { variants: false } },
  },
});
