import { Table, StatusBadge } from "@medusajs/ui";
import { ComissionRuleDTO } from "../../../../../modules/comission/types";

export const CommissionDetailTable = ({
  commissionRule,
}: {
  commissionRule: ComissionRuleDTO;
}) => {
  return (
    <>
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Default commission</Table.Cell>
            <Table.Cell>{commissionRule.rate.percentage_rate}%</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum commission per order</Table.Cell>
            <Table.Cell>{commissionRule.rate.min_price_set_id}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum commission per order</Table.Cell>
            <Table.Cell>{commissionRule.rate.max_price_set_id}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Commission charged including tax</Table.Cell>
            <Table.Cell>
              <StatusBadge
                color={commissionRule.rate.include_tax ? "green" : "grey"}
              >
                {commissionRule.rate.include_tax ? "True" : "False"}
              </StatusBadge>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
};
