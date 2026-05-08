import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { SellerDTO } from "@mercurjs/types";
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useProduct } from "../../../hooks/api/products";
import { ProductActiveRequestSection } from "./components/product-active-request-section";
import { ProductAttributeSection } from "./components/product-attribute-section";
import { ProductGeneralSection } from "./components/product-general-section";
import { ProductMediaSection } from "./components/product-media-section";
import { ProductOrganizationSection } from "./components/product-organization-section";
import { ProductVariantSection } from "./components/product-variant-section";
import { productLoader } from "./loader";
import { PRODUCT_DETAIL_QUERY } from "../constants";

type AdminProductWithSeller = HttpTypes.AdminProduct & {
  sellers?: SellerDTO[];
};

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productLoader>
  >;

  const { id } = useParams();
  const {
    product: rawProduct,
    isLoading,
    isError,
    error,
  } = useProduct(id!, PRODUCT_DETAIL_QUERY, {
    initialData: initialData,
  });
  const product = rawProduct as AdminProductWithSeller | undefined;

  if (isLoading || !product) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={3}
        showJSON
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage
      data={product}
      showJSON
      showMetadata
      data-testid="product-detail-page"
    >
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage
      data={product}
      showJSON
      showMetadata
      data-testid="product-detail-page"
    >
      <TwoColumnPage.Main data-testid="product-detail-main">
        <ProductActiveRequestSection product={product} />
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="product-detail-sidebar">
        <ProductOrganizationSection product={product} />
        <ProductAttributeSection product={product} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const ProductDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainActiveRequestSection: ProductActiveRequestSection,
  MainGeneralSection: ProductGeneralSection,
  MainMediaSection: ProductMediaSection,
  MainAttributeSection: ProductAttributeSection,
  MainVariantSection: ProductVariantSection,
  SidebarOrganizationSection: ProductOrganizationSection,
});
