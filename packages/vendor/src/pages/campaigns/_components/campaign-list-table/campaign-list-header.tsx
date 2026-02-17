import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading } from "@medusajs/ui";

export const CampaignListTitle = () => {
  const { t } = useTranslation();
  return <Heading level="h2">{t("campaigns.domain")}</Heading>;
};

export const CampaignListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <Link to="/campaigns/create">
      <Button size="small" variant="secondary">
        {t("actions.create")}
      </Button>
    </Link>
  );
};

export const CampaignListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <CampaignListCreateButton />
      )}
    </div>
  );
};

export const CampaignListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CampaignListTitle />
          <CampaignListActions />
        </>
      )}
    </div>
  );
};
