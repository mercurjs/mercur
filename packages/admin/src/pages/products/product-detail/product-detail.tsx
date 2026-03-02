import { Children, ComponentProps, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useProduct } from "../../../hooks/api/products";

import { ProductAttributeSection } from "./components/product-attribute-section";
import { ProductGeneralSection } from "./components/product-general-section";
import { ProductMediaSection } from "./components/product-media-section";
import { ProductOptionSection } from "./components/product-option-section";
import { ProductOrganizationSection } from "./components/product-organization-section";
import { ProductSalesChannelSection } from "./components/product-sales-channel-section";
import { ProductSellerSection } from "./components/product-seller-section/product-seller-section";
import { ProductShippingProfileSection } from "./components/product-shipping-profile-section";
import { ProductVariantSection } from "./components/product-variant-section";
import { ProductDetailProvider, useProductDetailContext } from "./context";
import { productLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productLoader>
  >;

  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(
    id!,
    {},
    {
      initialData: initialData,
    },
  );

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

  return (
    <ProductDetailProvider product={product}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <div data-testid="product-detail-page">
          <Layout>
            <TwoColumnPage.Main data-testid="product-detail-main">
              <ProductGeneralSection />
              <ProductMediaSection />
              <ProductOptionSection />
              <ProductVariantSection />
            </TwoColumnPage.Main>
            <TwoColumnPage.Sidebar data-testid="product-detail-sidebar">
              <ProductSellerSection seller={(product as any).seller} />
          <ProductSalesChannelSection />
              <ProductShippingProfileSection />
              <ProductOrganizationSection />
              <ProductAttributeSection />
                </TwoColumnPage.Sidebar>
          </Layout>
        </div>
      )}
    </ProductDetailProvider>
  );
};

const Layout = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TwoColumnPage>, "data"> & {
  children: ReactNode;
}) => {
  const { product } = useProductDetailContext();
  return (
    <TwoColumnPage showJSON showMetadata data={product} {...props}>
      {children}
    </TwoColumnPage>
  );
};

export const ProductDetailPage = Object.assign(Root, {
  Layout,
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: ProductGeneralSection,
  MainMediaSection: ProductMediaSection,
  MainOptionSection: ProductOptionSection,
  MainVariantSection: ProductVariantSection,
  SidebarSellerSection: ProductSellerSection,
  SidebarSalesChannelSection: ProductSalesChannelSection,
  SidebarShippingProfileSection: ProductShippingProfileSection,
  SidebarOrganizationSection: ProductOrganizationSection,
  SidebarAttributeSection: ProductAttributeSection,
  useContext: useProductDetailContext,
});
