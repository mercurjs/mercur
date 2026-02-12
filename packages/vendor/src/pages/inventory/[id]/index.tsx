// Route: /inventory/:id
import { HttpTypes } from "@medusajs/types";
import {
  UIMatch,
  useLoaderData,
  useParams,
  LoaderFunctionArgs,
} from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useDashboardExtension } from "@/extensions";
import { useInventoryItem } from "@hooks/api/inventory";
import { inventoryItemsQueryKeys } from "@hooks/api/inventory";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { InventoryItemAttributeSection } from "./_components/inventory-item-attributes/attributes-section";
import { InventoryItemGeneralSection } from "./_components/inventory-item-general-section";
import { InventoryItemLocationLevelsSection } from "./_components/inventory-item-location-levels";
import { InventoryItemVariantsSection } from "./_components/inventory-item-variants/variants-section";
import { INVENTORY_DETAIL_FIELDS } from "./constants";

// Loader
const inventoryDetailQuery = (id: string) => ({
  queryKey: inventoryItemsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(
      `/vendor/inventory-items/${id}?fields=${INVENTORY_DETAIL_FIELDS}`,
      { method: "GET" },
    ),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = inventoryDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};

// Breadcrumb
type InventoryDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminInventoryItemResponse>;

export const Breadcrumb = (props: InventoryDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  const { inventory_item } = useInventoryItem(
    id!,
    { fields: INVENTORY_DETAIL_FIELDS },
    { initialData: props.data, enabled: Boolean(id) },
  );

  if (!inventory_item) return null;
  return <span>{inventory_item.title ?? inventory_item.sku ?? id}</span>;
};

// Main component
export const Component = () => {
  const { id } = useParams();
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { inventory_item, isPending: isLoading } = useInventoryItem(
    id!,
    { fields: INVENTORY_DETAIL_FIELDS },
    { initialData },
  );

  if (isLoading || !inventory_item) {
    return (
      <TwoColumnPageSkeleton
        showJSON
        mainSections={3}
        sidebarSections={2}
        showMetadata
      />
    );
  }

  return (
    <TwoColumnPage data={inventory_item}>
      <TwoColumnPage.Main>
        <InventoryItemGeneralSection inventoryItem={inventory_item} />
        <InventoryItemLocationLevelsSection inventoryItem={inventory_item} />
        {/* <InventoryItemReservationsSection inventoryItem={inventory_item} /> */}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <InventoryItemVariantsSection
          variants={(inventory_item as any).variants}
        />
        <InventoryItemAttributeSection inventoryItem={inventory_item as any} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
