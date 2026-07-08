import { Children, ReactNode } from "react";
import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared";
import { useProductCategory } from "@hooks/api";

import { CategoryGeneralSection } from "./_components/category-general-section";
import { CategoryIconSection } from "./_components/category-icon-section";
import { CategoryMediaSection } from "./_components/category-media-section";
import { CategoryOrganizeSection } from "./_components/category-organize-section";
import { CategoryProductSection } from "./_components/category-product-section";

const Root = ({ children }: { children?: ReactNode }) => {
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
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={product_category}>
          <TwoColumnPage.Main>
            <WidgetZone id="categories.detail.main" data={product_category}>
              <CategoryGeneralSection category={product_category} />
              <CategoryMediaSection category={product_category} />
              <CategoryIconSection category={product_category} />
              <CategoryProductSection category={product_category} />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="categories.detail.side" data={product_category}>
              <CategoryOrganizeSection category={product_category} />
            </WidgetZone>
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const CategoryDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CategoryGeneralSection,
  MainMediaSection: CategoryMediaSection,
  MainIconSection: CategoryIconSection,
  MainProductSection: CategoryProductSection,
  SidebarOrganizeSection: CategoryOrganizeSection,
});
