import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useAlgolia, useSyncAlgolia } from "../../hooks/api/algolia";

const AlgoliaSearchEnginePage = () => {

  const { data: algolia } = useAlgolia()
  const { mutateAsync: triggerSynchronization } = useSyncAlgolia()

  const handleTriggerSynchronization = async () => {
    try {
      await triggerSynchronization()
      toast.success("Synchronization triggered!");
    } catch {
      toast.error("Error!");
    }
  }
  
  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Algolia Search Engine</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Check Algolia Search Engine status
          </Text>
        </div>
        <Button onClick={handleTriggerSynchronization}>Trigger Synchronization</Button>
      </div>

      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Application ID</Table.Cell>
            <Table.Cell>
              { algolia?.appId }
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>ProductIndex</Table.Cell>
            <Table.Cell>
              { algolia?.productIndex 
                ? <StatusBadge color={"green"}>Exists</StatusBadge> 
                : <StatusBadge color={"red"}>Doesn't exist</StatusBadge>
              }
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Algolia Search Engine",
});

export default AlgoliaSearchEnginePage;
