import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk";
import { Text } from "@medusajs/ui";

type ProductRow = { variants?: unknown[] | null };

export default defineCustomFieldsConfig({
  model: "category",
  list: {
    // Category detail → products table
    zone: "products",
    columns: [
      // REPLACE the built-in variants column
      {
        id: "variants",
        header: "Variant count",
        component: ({ row }) => (
          <Text size="small" weight="plus">
            {(row as ProductRow).variants?.length ?? 0}
          </Text>
        ),
      },
    ],
    // HIDE built-in columns
    viewDefaults: { columnVisibility: { collection: false } },
  },
});
