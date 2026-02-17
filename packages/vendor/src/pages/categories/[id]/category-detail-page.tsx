import { Children, ReactNode } from "react";
import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useProductCategory } from "@hooks/api";

import { CategoryGeneralSection } from "./_components/category-general-section";
import { CategoryOrganizeSection } from "./_components/category-organize-section";
import { CategoryProductSection } from "./_components/category-product-section";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const {
    product_category,
    isLoading: categoryLoading,
    isError: categoryError,
    error,
  } = useProductCategory(id!, {
    fields: "+is_active,+is_internal",
  });

  if (categoryLoading || !product_category) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
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
            <CategoryGeneralSection category={product_category} />
            <CategoryProductSection category={product_category} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <CategoryOrganizeSection category={product_category} />
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
  MainProductSection: CategoryProductSection,
  SidebarOrganizeSection: CategoryOrganizeSection,
});
