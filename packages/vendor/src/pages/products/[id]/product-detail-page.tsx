import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useProduct } from "@hooks/api";

import { PRODUCT_DETAIL_QUERY } from "../common/constants";
import { loader } from "./loader";

import { ProductActiveEditSection } from "./_components/product-active-edit-section";
import { ProductChangeRequestSection } from "./_components/product-change-request-section";
import { ProductGeneralSection } from "./_components/product-general-section";
import { ProductMediaSection } from "./_components/product-media-section";
import { ProductOrganizationSection } from "./_components/product-organization-section";
import { ProductVariantSection } from "./_components/product-variant-section";
import { ProductAttributeSection } from "./_components/product-attribute-section";

export const ProductDetailPage = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const { id } = useParams();
  const query = useLinkQuery("product", PRODUCT_DETAIL_QUERY.fields);
  const { product, isLoading, isError, error } = useProduct(id!, query, {
    initialData,
  });

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="product.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={product}
      data-testid="product-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ProductChangeRequestSection">
              <ProductChangeRequestSection product={product} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductActiveEditSection">
              <ProductActiveEditSection product={product} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductGeneralSection">
              <ProductGeneralSection product={product} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductMediaSection">
              <ProductMediaSection product={product} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductVariantSection">
              <ProductVariantSection product={product} />
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="ProductOrganizationSection">
              <ProductOrganizationSection product={product} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductAttributeSection">
              <ProductAttributeSection product={product} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
