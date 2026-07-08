import { Heading } from "@medusajs/ui";
import { useLinkQuery } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";
import { useCustomerGroup } from "@hooks/api/customer-groups";

import { EditCustomerGroupForm } from "./components/edit-customer-group-form";

export const CustomerGroupEdit = () => {
  const { id } = useParams();
  const query = useLinkQuery("customer_group");
  const { customer_group, isLoading, isError, error } = useCustomerGroup(
    id!,
    query,
  );

  const { t } = useTranslation();

  if (isError) {
    throw error;
  }

  const ready = !isLoading && !!customer_group;

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("customerGroups.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("customerGroups.edit.header")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCustomerGroupForm group={customer_group} />}
    </RouteDrawer>
  );
};
