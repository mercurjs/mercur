import { Button, Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { DisplayExtensionZone, PermissionAction } from "@mercurjs/dashboard-shared";

import { StoreMembersDataTable } from "./store-members-data-table";

type StoreMembersSectionProps = {
  sellerId: string;
};

export const StoreMembersSection = ({ sellerId }: StoreMembersSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("users.domain")}</Heading>
        <PermissionAction permission="members.invites:edit">
          <Button size="small" variant="secondary" asChild>
            <Link to="invite">{t("stores.members.addUser.action")}</Link>
          </Button>
        </PermissionAction>
      </div>
      <StoreMembersDataTable sellerId={sellerId} />
      <DisplayExtensionZone model="seller" zone="members" data={sellerId} />
    </Container>
  );
};
