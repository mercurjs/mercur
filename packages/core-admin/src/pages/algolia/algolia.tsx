import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";

import { useAlgolia, useSyncAlgolia } from "@hooks/api/algolia";

export const Algolia = () => {
  const { data: algolia } = useAlgolia();
  const { mutateAsync: triggerSynchronization } = useSyncAlgolia();

  const handleTriggerSynchronization = async () => {
    try {
      await triggerSynchronization();
      toast.success("Synchronization triggered!");
    } catch {
      toast.error("Error!");
    }
  };

  return (
    <Container data-testid="algolia-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="algolia-header">
        <div>
          <Heading data-testid="algolia-heading">Algolia Search Engine</Heading>
          <Text className="text-ui-fg-subtle" size="small" data-testid="algolia-description">
            Check Algolia Search Engine status
          </Text>
        </div>
        <Button onClick={handleTriggerSynchronization} data-testid="algolia-trigger-synchronization-button">
          Trigger Synchronization
        </Button>
      </div>

      <Table data-testid="algolia-table">
        <Table.Body data-testid="algolia-table-body">
          <Table.Row data-testid="algolia-table-row-application-id">
            <Table.Cell data-testid="algolia-table-cell-application-id-label">Application ID</Table.Cell>
            <Table.Cell data-testid="algolia-table-cell-application-id-value">{algolia?.appId}</Table.Cell>
          </Table.Row>
          <Table.Row data-testid="algolia-table-row-product-index">
            <Table.Cell data-testid="algolia-table-cell-product-index-label">ProductIndex</Table.Cell>
            <Table.Cell data-testid="algolia-table-cell-product-index-value">
              {algolia?.productIndex ? (
                <StatusBadge color="green" data-testid="algolia-product-index-exists-badge">Exists</StatusBadge>
              ) : (
                <StatusBadge color="red" data-testid="algolia-product-index-not-exists-badge">Doesn&apos;t exist</StatusBadge>
              )}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Container>
  );
};
