import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { HttpTypes as MercurHttpTypes, SellerDTO } from "@mercurjs/types";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { useProduct } from "../../../hooks/api/products";
import { ProductActiveEditSection } from "./components/product-active-edit-section";
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

export const ProductDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productLoader>
  >;

  const { id } = useParams();
  const query = useLinkQuery("product", PRODUCT_DETAIL_QUERY.fields);
  const {
    product: rawProduct,
    isLoading,
    isError,
    error,
  } = useProduct(id!, query, {
    initialData: initialData as unknown as MercurHttpTypes.AdminProductResponse,
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

  return (
    <LayoutComposer
      widgetsZonePrefix="product.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={product}
      data-testid="product-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ProductActiveRequestSection">
              <ProductActiveRequestSection product={product} />
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
            {detailPageDefaultEntries(product)}
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
