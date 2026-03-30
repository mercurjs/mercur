import { PencilSquare } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { DateRangeDisplay } from "@components/common/date-range-display";
import { HttpTypes } from "@mercurjs/types";

type StoreConfigurationSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
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
                  to: "store-closure",
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
