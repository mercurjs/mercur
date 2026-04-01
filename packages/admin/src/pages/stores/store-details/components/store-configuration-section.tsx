import { PencilSquare } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../components/common/action-menu";
import { DateRangeDisplay } from "../../../../components/common/date-range-display";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreConfigurationSectionProps = {
  seller: Seller;
};

export const StoreConfigurationSection = ({
  seller,
}: StoreConfigurationSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">
          {t("store.scheduledClosure.header", "Scheduled Closure")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: `/stores/${seller.id}/store-closure`,
                },
              ],
            },
          ]}
        />
      </div>
      <DateRangeDisplay
        startsAt={seller.closed_from}
        endsAt={seller.closed_to}
        showTime
      />
    </Container>
  );
};
