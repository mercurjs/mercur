import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer, PermissionGuard } from "@mercurjs/dashboard-shared";
import { useProductType } from "@hooks/api/product-types";

import { ProductTypeGeneralSection } from "./_components/product-type-general-section";
import { ProductTypeProductSection } from "./_components/product-type-product-section";

import type { productTypeLoader } from "./loader";

export const ProductTypeDetailPage = () => {
  const { id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTypeLoader>
  >;

  const { product_type, isPending, isError, error } = useProductType(
    id!,
    undefined,
    {
      initialData,
    },
  );

  if (isPending || !product_type) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="product-types.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={product_type}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ProductTypeGeneralSection">
              <ProductTypeGeneralSection productType={product_type} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ProductTypeProductSection">
              <PermissionGuard permission="products:view">
                <ProductTypeProductSection productType={product_type} />
              </PermissionGuard>
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
