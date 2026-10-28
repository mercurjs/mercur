import { ExclamationCircle } from "@medusajs/icons";
import { Container, Heading, Tooltip } from "@medusajs/ui";
import { PayoutDTO, PayoutReversalDTO } from "@mercurjs/types";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { NoRecords } from "@components/common/empty-table-content";
import { _DataTable } from "@components/table/data-table/data-table";
import { DateCell } from "@components/table/table-cells/common/date-cell";
import { MoneyAmountCell } from "@components/table/table-cells/common/money-amount-cell";
import { StatusCell } from "@components/table/table-cells/common/status-cell";
import { TextCell } from "@components/table/table-cells/common/text-cell";
import { useDataTable } from "@hooks/use-data-table";

import { payoutStatusColor } from "../../_components/payout-status";

const columnHelper = createColumnHelper<PayoutReversalDTO>();

export const PayoutReversalsSection = ({ payout }: { payout: PayoutDTO }) => {
  const { t } = useTranslation();

  const reversals = useMemo(() => payout.reversals ?? [], [payout.reversals]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => t("fields.date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("refund_id", {
        header: () => t("payouts.reversals.refund"),
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("amount", {
        header: () => t("fields.amount"),
        cell: ({ getValue }) => (
          <MoneyAmountCell currencyCode={payout.currency_code} amount={Number(getValue())} />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => t("fields.status"),
        cell: ({ getValue, row }) => {
          const reason = row.original.status_reason;
          return (
            <div className="flex h-full w-full items-center gap-x-2">
              <StatusCell color={payoutStatusColor(getValue())}>
                {t(`payouts.status.${getValue()}`)}
              </StatusCell>
              {reason && (
                <Tooltip content={reason}>
                  <ExclamationCircle className="text-ui-tag-orange-icon shrink-0" />
                </Tooltip>
              )}
            </div>
          );
        },
      }),
    ],
    [t, payout.currency_code],
  );

  const { table } = useDataTable({
    data: reversals,
    count: reversals.length,
    columns,
    getRowId: (row) => row.id,
    pageSize: Math.max(reversals.length, 1),
  });

  return (
    <Container className="divide-y p-0" data-testid="payout-reversals-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.reversals.header")}</Heading>
      </div>
      {reversals.length > 0 ? (
        <_DataTable
          table={table}
          columns={columns}
          pageSize={Math.max(reversals.length, 1)}
          count={reversals.length}
        />
      ) : (
        <NoRecords
          className="border-t"
          title={t("payouts.reversals.noRecordsTitle")}
          message={t("payouts.reversals.noRecordsMessage")}
        />
      )}
    </Container>
  );
};
