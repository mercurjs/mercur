import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  PermissionGuard,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useProductCategory } from "@hooks/api";

import { CategoryGeneralSection } from "./_components/category-general-section";
import { CategoryIconSection } from "./_components/category-icon-section";
import { CategoryMediaSection } from "./_components/category-media-section";
import { CategoryOrganizeSection } from "./_components/category-organize-section";
import { CategoryProductSection } from "./_components/category-product-section";

export const CategoryDetailPage = () => {
  const { id } = useParams();

  const linkQuery = useLinkQuery("category", "+is_active,+is_internal");

  const {
    product_category,
    isLoading: categoryLoading,
    isError: categoryError,
    error,
  } = useProductCategory(id!, linkQuery);

  if (categoryLoading || !product_category) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    );
  }

  if (categoryError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="categories.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={product_category}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CategoryGeneralSection">
              <CategoryGeneralSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryMediaSection">
              <CategoryMediaSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryIconSection">
              <CategoryIconSection category={product_category} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CategoryProductSection">
              <PermissionGuard permission="products:view">
                <CategoryProductSection category={product_category} />
              </PermissionGuard>
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <LayoutComposer.Entry id="CategoryOrganizeSection">
            <CategoryOrganizeSection category={product_category} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
