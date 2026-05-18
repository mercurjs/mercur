import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "../../../components/modals";
import { InviteMemberForm } from "./components/invite-member-form";

const Root = () => {
  const { t } = useTranslation();

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("stores.members.addUser.header")}</Heading>
      </RouteDrawer.Header>
      <InviteMemberForm />
    </RouteDrawer>
  );
};

export const Component = Root;
