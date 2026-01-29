import { StatusBadge, Table } from "@medusajs/ui";

import type {
  AdminCommissionAggregate,
  AdminCommissionPriceValue,
} from "@custom-types/commission";

const getFormattedPriceValue = (
  values: AdminCommissionPriceValue[] | undefined,
) => {
  if (!values) {
    return "-";
  }

  const prices = values.map(
    (p) => `${p.amount}${p.currency_code?.toUpperCase()}`,
  );

  return prices?.join("/") || "-";
};

export const CommissionDetailTable = ({
  commissionRule,
}: {
  commissionRule?: AdminCommissionAggregate;
}) => {
  return (
    <>
      <Table data-testid="commission-detail-table">
        <Table.Body data-testid="commission-detail-table-body">
          <Table.Row data-testid="commission-detail-table-row-default-commission">
            <Table.Cell data-testid="commission-detail-table-row-default-commission-label">Default commission</Table.Cell>
            <Table.Cell data-testid="commission-detail-table-row-default-commission-value">{commissionRule?.fee_value} </Table.Cell>
          </Table.Row>
          <Table.Row data-testid="commission-detail-table-row-minimum-commission">
            <Table.Cell data-testid="commission-detail-table-row-minimum-commission-label">Minimum commission per order</Table.Cell>
            <Table.Cell data-testid="commission-detail-table-row-minimum-commission-value">
              {getFormattedPriceValue(commissionRule?.min_price_set)}
            </Table.Cell>
          </Table.Row>
          <Table.Row data-testid="commission-detail-table-row-maximum-commission">
            <Table.Cell data-testid="commission-detail-table-row-maximum-commission-label">Maximum commission per order</Table.Cell>
            <Table.Cell data-testid="commission-detail-table-row-maximum-commission-value">
              {getFormattedPriceValue(commissionRule?.max_price_set)}
            </Table.Cell>
          </Table.Row>
          <Table.Row data-testid="commission-detail-table-row-include-tax">
            <Table.Cell data-testid="commission-detail-table-row-include-tax-label">Commission charged including tax</Table.Cell>
            <Table.Cell data-testid="commission-detail-table-row-include-tax-value">
              <StatusBadge
                color={commissionRule?.include_tax ? "green" : "grey"}
              >
                {commissionRule?.include_tax ? "True" : "False"}
              </StatusBadge>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
};
