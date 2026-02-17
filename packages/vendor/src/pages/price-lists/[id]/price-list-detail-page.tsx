import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { usePriceList } from "@hooks/api/price-lists";

import { PriceListConfigurationSection } from "./_components/price-list-configuration-section";
import { PriceListGeneralSection } from "./_components/price-list-general-section";
import { PriceListProductSection } from "./_components/price-list-product-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();

  const { price_list, isLoading, isError, error } = usePriceList(id!, undefined, {
    placeholderData: initialData,
  });

  if (isLoading || !price_list) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage hasOutlet data={price_list}>
          <TwoColumnPage.Main>
            <PriceListGeneralSection priceList={price_list} />
            <PriceListProductSection priceList={price_list} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <PriceListConfigurationSection priceList={price_list} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const PriceListDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PriceListGeneralSection,
  MainProductSection: PriceListProductSection,
  SidebarConfigurationSection: PriceListConfigurationSection,
});
