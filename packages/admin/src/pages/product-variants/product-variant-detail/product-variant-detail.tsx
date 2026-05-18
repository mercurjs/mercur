import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { SellerDTO } from "@mercurjs/types";
import { useProduct, useProductVariant } from "../../../hooks/api/products";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { VariantGeneralSection } from "./components/variant-general-section";
import { VariantInventorySectionConnected } from "./components/variant-inventory-section";
import { VariantPricesSection } from "./components/variant-prices-section";
import { variantLoader } from "./loader";

type AdminProductWithSeller = HttpTypes.AdminProduct & {
  seller?: SellerDTO;
};

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >;

  const { id, variant_id } = useParams();
  const { product: rawProduct } = useProduct(id!);
  const product = rawProduct as AdminProductWithSeller | undefined;
  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    {},
    {
      initialData,
    },
  );

  if (isLoading || !variant) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        <VariantInventorySectionConnected variant={variant} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const ProductVariantDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: VariantGeneralSection,
  MainInventorySection: VariantInventorySectionConnected,
  SidebarPricesSection: VariantPricesSection,
});
