import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { useProductVariant } from "../../../hooks/api/products";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared";
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { VariantAttributeSection } from "./components/variant-attribute-section";
import { VariantGeneralSection } from "./components/variant-general-section";
import { variantLoader } from "./loader";

export const ProductVariantDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof variantLoader>
  >;

  const { id, variant_id } = useParams();
  const { variant: rawVariant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    { fields: "*options,*options.option" },
    {
      initialData,
    },
  );
  const variant = rawVariant as HttpTypes.AdminProductVariant | undefined;

  if (isLoading || !variant) {
    return (
      <TwoColumnPageSkeleton
        mainSections={1}
        sidebarSections={1}
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
      widgetsZonePrefix="product-variants.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={variant}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="VariantGeneralSection">
              <VariantGeneralSection variant={variant} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(variant)}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="VariantAttributeSection">
            <VariantAttributeSection variant={variant} productId={id!} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
