import { Table, StatusBadge } from "@medusajs/ui";
import { AdminCommissionAggregate, AdminCommissionPriceValue } from "../types";


const getFormattedPriceValue = (values: AdminCommissionPriceValue[] | undefined) => {
  if(!values) {
    return '-'
  }

  const prices = values.map(p => `${p.amount}${p.currency_code?.toUpperCase()}`)
  return prices?.join('/') || '-'
}

export const CommissionDetailTable = ({
  commissionRule,
}: {
  commissionRule?: AdminCommissionAggregate;
}) => {
  return (
    <>
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Default commission</Table.Cell>
            <Table.Cell>{commissionRule?.fee_value} </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum commission per order</Table.Cell>
            <Table.Cell>{getFormattedPriceValue(commissionRule?.min_price_set)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Maximum commission per order</Table.Cell>
            <Table.Cell>{getFormattedPriceValue(commissionRule?.max_price_set)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Commission charged including tax</Table.Cell>
            <Table.Cell>
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
