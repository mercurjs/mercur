import { Container, Heading, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { DateCell } from "../../../../components/table/table-cells/common/date-cell";
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
  const hasTimeOff = Boolean(seller.closed_from || seller.closed_to);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("store.timeOff.header")}</Heading>
      </div>
      {hasTimeOff ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t("fields.startDate")}</Table.HeaderCell>
              <Table.HeaderCell>{t("fields.endDate")}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <DateCell date={seller.closed_from ?? null} />
              </Table.Cell>
              <Table.Cell>
                <DateCell date={seller.closed_to ?? null} />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      ) : (
        <div className="flex flex-col items-center gap-y-1 pb-6 pt-2">
          <Text size="small" leading="compact" weight="plus">
            {t("store.timeOff.empty.title")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("store.timeOff.empty.message")}
          </Text>
        </div>
      )}
    </Container>
  );
};
