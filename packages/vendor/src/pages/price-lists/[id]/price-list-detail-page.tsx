import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer, useLinkQuery } from "@mercurjs/dashboard-shared";
import { usePriceList } from "@hooks/api/price-lists";

import { PriceListConfigurationSection } from "./_components/price-list-configuration-section";
import { PriceListCustomerAvailabilitySection } from "./_components/price-list-customer-availability-section";
import { PriceListGeneralSection } from "./_components/price-list-general-section";
import { PriceListProductSection } from "./_components/price-list-product-section";

import type { loader } from "./loader";

export const PriceListDetailPage = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();

  const linkQuery = useLinkQuery("price_list", "+prices.id");
  const { price_list, isLoading, isError, error } = usePriceList(id!, linkQuery, {
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
    <LayoutComposer
      widgetsZonePrefix="price-lists.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={price_list}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PriceListGeneralSection">
              <PriceListGeneralSection priceList={price_list} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PriceListCustomerAvailabilitySection">
              <PriceListCustomerAvailabilitySection priceList={price_list} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PriceListProductSection">
              <PriceListProductSection priceList={price_list} />
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <LayoutComposer.Entry id="PriceListConfigurationSection">
            <PriceListConfigurationSection priceList={price_list} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
