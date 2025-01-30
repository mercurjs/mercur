import { Table, StatusBadge } from "@medusajs/ui";
import { AdminCommissionAggregate } from "@mercurjs/http-client";

const getFormattedPrice = (amount: string | null | undefined, currency: string | null | undefined) => {
  if(!amount || !currency) {
    return '-'
  }
  return `${amount} ${currency}`
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
            <Table.Cell>{commissionRule?.fee_value}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum commission per order</Table.Cell>
            <Table.Cell>{getFormattedPrice(commissionRule?.min_price_amount, commissionRule?.min_price_currency)}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Maximum commission per order</Table.Cell>
            <Table.Cell>{getFormattedPrice(commissionRule?.max_price_amount, commissionRule?.max_price_currency)}</Table.Cell>
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
