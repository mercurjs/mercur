import { useCommissionRules } from "../../../../hooks/api/commission";
import { Table, StatusBadge, Text } from "@medusajs/ui";

export const CommissionTable = () => {
  const { data, loading, error } = useCommissionRules();

  return (
    <div className="flex size-full flex-col overflow-hidden">
      {loading && <Text>Loading...</Text>}
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Rule name</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>Attribute</Table.HeaderCell>
            <Table.HeaderCell>Fee</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
      </Table>
    </div>
  );
};
