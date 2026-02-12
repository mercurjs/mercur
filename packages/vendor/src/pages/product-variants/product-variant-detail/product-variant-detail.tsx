import { useParams } from "react-router-dom";

import { useProduct } from "@hooks/api/products";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { VariantGeneralSection } from "./components/variant-general-section";
import {
  InventorySectionPlaceholder,
  VariantInventorySection,
} from "./components/variant-inventory-section";
import { VariantPricesSection } from "./components/variant-prices-section";

export const ProductVariantDetail = () => {
  const { product_id, variant_id } = useParams();
  const { product, isLoading, isError, error } = useProduct(product_id!, {
    fields: "*variants.inventory_items",
  });

  const variant = product?.variants?.find((item) => item.id === variant_id);

  if (isLoading || !variant) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} />;
  }

  if (isError) {
    throw error;
  }
  return (
    <TwoColumnPage data={variant} hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        {!variant.manage_inventory ? (
          <InventorySectionPlaceholder />
        ) : (
          variant.inventory_items && (
            <VariantInventorySection
              inventoryItems={variant.inventory_items.map((i) => {
                return {
                  id: i.inventory_item_id,
                  required_quantity: i.required_quantity,
                  variant,
                };
              })}
            />
          )
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
