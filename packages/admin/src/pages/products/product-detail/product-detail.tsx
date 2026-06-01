import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { SellerDTO } from "@mercurjs/types";
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useProduct } from "../../../hooks/api/products";
import { ProductAttributeSection } from "./components/product-attribute-section";
import { ProductGeneralSection } from "./components/product-general-section";
import { ProductMediaSection } from "./components/product-media-section";
import { ProductOptionSection } from "./components/product-option-section";
import { ProductOrganizationSection } from "./components/product-organization-section";
import {
  ProductRoleReviewSection,
  createPublicDijieRoleMetadata,
} from "./components/product-role-review-section";
import { ProductSalesChannelSection } from "./components/product-sales-channel-section";
import { ProductSellerSection } from "./components/product-seller-section/product-seller-section";
import { ProductShippingProfileSection } from "./components/product-shipping-profile-section";
import { ProductVariantSection } from "./components/product-variant-section";
import { productLoader } from "./loader";
import { PRODUCT_DETAIL_QUERY } from "../constants";

type AdminProductWithSeller = HttpTypes.AdminProduct & {
  seller?: SellerDTO;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
};

const hasDijieRoleMetadata = (product: AdminProductWithSeller) => {
  return Object.keys(asRecord(asRecord(product.metadata).dijieRole)).length > 0;
};

const sanitizeProductForExtraData = (
  product: AdminProductWithSeller,
): AdminProductWithSeller => {
  const metadata = asRecord(product.metadata);
  const role = asRecord(metadata.dijieRole);

  if (!Object.keys(role).length) {
    return product;
  }

  return {
    ...product,
    metadata: {
      ...metadata,
      dijieRole: createPublicDijieRoleMetadata(role),
    },
  };
};

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productLoader>
  >;

  const { id } = useParams();
  const { product: rawProduct, isLoading, isError, error } = useProduct(
    id!,
    PRODUCT_DETAIL_QUERY,
    {
      initialData: initialData,
    },
  );
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

  const isDijieRoleProduct = hasDijieRoleMetadata(product);
  const extraDataProduct = sanitizeProductForExtraData(product);

  return Children.count(children) > 0 ? (
    <TwoColumnPage
      data={extraDataProduct}
      showJSON
      showMetadata={!isDijieRoleProduct}
      data-testid="product-detail-page"
    >
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage
      data={extraDataProduct}
      showJSON
      showMetadata={!isDijieRoleProduct}
      data-testid="product-detail-page"
    >
      <TwoColumnPage.Main data-testid="product-detail-main">
        <ProductGeneralSection product={product} />
        <ProductRoleReviewSection product={product} />
        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="product-detail-sidebar">
        <ProductSellerSection seller={product.seller} />
        <ProductSalesChannelSection product={product} />
        <ProductShippingProfileSection product={product} />
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
  MainRoleReviewSection: ProductRoleReviewSection,
  MainMediaSection: ProductMediaSection,
  MainOptionSection: ProductOptionSection,
  MainVariantSection: ProductVariantSection,
  SidebarSellerSection: ProductSellerSection,
  SidebarSalesChannelSection: ProductSalesChannelSection,
  SidebarShippingProfileSection: ProductShippingProfileSection,
  SidebarOrganizationSection: ProductOrganizationSection,
  SidebarAttributeSection: ProductAttributeSection,
});
