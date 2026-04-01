import { Button, Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { StoreMembersDataTable } from "./store-members-data-table";

type StoreMembersSectionProps = {
  sellerId: string;
};

export const StoreMembersSection = ({ sellerId }: StoreMembersSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("users.domain", "Users")}</Heading>
        <Link to="invite">
          <Button size="small" variant="secondary">
            {t("users.invite", "Invite")}
          </Button>
        </Link>
      </div>
      <StoreMembersDataTable sellerId={sellerId} />
    </Container>
  );
};
