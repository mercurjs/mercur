import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useInventoryItem } from "@hooks/api/inventory";

import { InventoryItemAttributeSection } from "./_components/inventory-item-attributes/attributes-section";
import { InventoryItemGeneralSection } from "./_components/inventory-item-general-section";
import { InventoryItemLocationLevelsSection } from "./_components/inventory-item-location-levels";
import { InventoryItemVariantsSection } from "./_components/inventory-item-variants/variants-section";
import { INVENTORY_DETAIL_FIELDS } from "./constants";

import { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
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
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={inventory_item}>
          <TwoColumnPage.Main>
            <InventoryItemGeneralSection inventoryItem={inventory_item} />
            <InventoryItemLocationLevelsSection inventoryItem={inventory_item} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <InventoryItemVariantsSection
              variants={(inventory_item as any).variants}
            />
            <InventoryItemAttributeSection inventoryItem={inventory_item as any} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const InventoryDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: InventoryItemGeneralSection,
  MainLocationLevelsSection: InventoryItemLocationLevelsSection,
  SidebarVariantsSection: InventoryItemVariantsSection,
  SidebarAttributeSection: InventoryItemAttributeSection,
});
