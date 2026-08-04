import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";
import { usePriceList } from "@hooks/api/price-lists";

import { PriceListConfigurationForm } from "./price-list-configuration-form";

export const Component = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { price_list, isPending, isError, error } = usePriceList(id!);

  const ready = !isPending && !!price_list;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("priceLists.configuration.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && <PriceListConfigurationForm priceList={price_list} />}
    </RouteDrawer>
  );
};
