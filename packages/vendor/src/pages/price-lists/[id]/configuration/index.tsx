import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "@components/modals";
// import { useCustomerGroups } from "@hooks/api/customer-groups";
import { usePriceList } from "@hooks/api/price-lists";
import { PriceListConfigurationForm } from "./price-list-configuration-form";

export const Component = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { price_list, isPending, isError, error } = usePriceList(id!);

  // const customerGroupIds =
  //   price_list?.price_list_rules?.find(
  //     (rule: any) => rule.attribute === "customer.groups.id",
  //   )?.value || ([] as string[]);

  // const {
  //   customer_groups: customerGroupsData,
  //   isPending: isCustomerGroupsPending,
  //   isError: isCustomerGroupsError,
  //   error: customerGroupsError,
  // } = useCustomerGroups(undefined, { enabled: !!customerGroupIds?.length })

  // const customerGroups = customerGroupsData?.map((item) => item.customer_group)

  // const initialCustomerGroups = (customerGroups || []).filter((group) =>
  //   customerGroupIds.includes(group.id)
  // )

  // const isCustomerGroupsReady = isPending
  //   ? false
  //   : !!customerGroupIds?.length && isCustomerGroupsPending
  //     ? false
  //     : true

  const ready = !isPending && !!price_list; // && isCustomerGroupsReady

  if (isError) {
    throw error;
  }

  // if (isCustomerGroupsError) {
  //   throw customerGroupsError;
  // }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("priceLists.configuration.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && (
        <PriceListConfigurationForm
          priceList={price_list}
          customerGroups={[]}
        />
      )}
    </RouteDrawer>
  );
};
