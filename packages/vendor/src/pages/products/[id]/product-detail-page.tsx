import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useProduct } from "@hooks/api";

import { PRODUCT_DETAIL_QUERY } from "../common/constants";
import { loader } from "./loader";

import { ProductGeneralSection } from "./_components/product-general-section";
import { ProductMediaSection } from "./_components/product-media-section";
import { ProductOrganizationSection } from "./_components/product-organization-section";
import { ProductVariantSection } from "./_components/product-variant-section";
import { ProductAttributeSection } from "./_components/product-attribute-section";
import { ProductShippingProfileSection } from "./_components/product-shipping-profile-section";
import { ProductSalesChannelSection } from "./_components/product-sales-channel-section";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(
    id!,
    PRODUCT_DETAIL_QUERY,
    {
      initialData,
    }
  );

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={product} data-testid="product-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={product} data-testid="product-detail-page">
      <TwoColumnPage.Main data-testid="product-detail-main">
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
  MainGeneralSection: ProductGeneralSection,
  MainMediaSection: ProductMediaSection,
  MainVariantSection: ProductVariantSection,
  MainAttributeSection: ProductAttributeSection,
  SidebarShippingProfileSection: ProductShippingProfileSection,
  SidebarOrganizationSection: ProductOrganizationSection,
  SidebarSalesChannelSection: ProductSalesChannelSection,
});
