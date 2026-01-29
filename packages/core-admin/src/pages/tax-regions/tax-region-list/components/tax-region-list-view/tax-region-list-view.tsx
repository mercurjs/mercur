import { Container, Heading, Text } from "@medusajs/ui";

import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useTaxRegions } from "../../../../../hooks/api/tax-regions";
import { useTaxRegionTableQuery } from "../../../../../hooks/table/query/use-tax-region-table-query";
import { TaxRegionTable } from "../../../common/components/tax-region-table";
import { useTaxRegionTable } from "../../../common/hooks/use-tax-region-table";

const PAGE_SIZE = 20;

export const TaxRegionListView = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useTaxRegionTableQuery({
    pageSize: PAGE_SIZE,
  });
  const { tax_regions, count, isPending, isError, error } = useTaxRegions(
    {
      ...searchParams,
      parent_id: "null",
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const { table } = useTaxRegionTable({
    count,
    data: tax_regions,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="tax-region-list-view-container">
      <TaxRegionTable
        action={{
          to: "create",
          label: t("actions.create"),
        }}
        isPending={isPending}
        queryObject={raw}
        table={table}
        count={count}
        data-testid="tax-region-list-view-table"
      >
        <Heading data-testid="tax-region-list-view-heading">{t("taxes.domain")}</Heading>
        <Text size="small" className="text-pretty text-ui-fg-subtle" data-testid="tax-region-list-view-hint">
          {t("taxRegions.list.hint")}
        </Text>
      </TaxRegionTable>
    </Container>
  );
};
