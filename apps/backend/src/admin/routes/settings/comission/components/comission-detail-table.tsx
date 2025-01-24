import { Table, StatusBadge } from "@medusajs/ui";
import { ComissionRuleDTO } from "../../../../../modules/comission/types";

export const ComissionDetailTable = ({
  comissionRule,
}: {
  comissionRule: ComissionRuleDTO;
}) => {
  //cusePriceLists("pset_01JEREB5JT2V75ZD25HDB7ZXEX");
  return (
    <>
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Default comission</Table.Cell>
            <Table.Cell>{comissionRule.rate.percentage_rate}%</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum comission per order</Table.Cell>
            <Table.Cell>{comissionRule.rate.min_price_set_id}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Minimum comission per order</Table.Cell>
            <Table.Cell>{comissionRule.rate.max_price_set_id}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Comission charged including tax</Table.Cell>
            <Table.Cell>
              <StatusBadge
                color={comissionRule.rate.include_tax ? "green" : "grey"}
              >
                {comissionRule.rate.include_tax ? "True" : "False"}
              </StatusBadge>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
};
