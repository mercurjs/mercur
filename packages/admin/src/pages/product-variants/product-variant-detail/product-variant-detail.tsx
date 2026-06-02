import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { useProductVariant } from "../../../hooks/api/products";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { VariantGeneralSection } from "./components/variant-general-section";
import { variantLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
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
        sidebarSections={0}
        showJSON
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={variant} showJSON showMetadata hasOutlet>
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>{null}</TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const ProductVariantDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: VariantGeneralSection,
});
