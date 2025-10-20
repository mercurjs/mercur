import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Drawer,
  Heading,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import {
  useConfigurationRules,
  useUpdateConfigurationRule,
} from "../../hooks/api/configuration";
import { useState } from "react";
import CreateConfigurationRuleForm from "./components/create-rule-form";
import { ConfigurationRuleTooltip, RuleType } from "./components/rule-tooltip";

const ConfigurationRulesPage = () => {
  const [open, setOpen] = useState(false);
  const { configuration_rules, isLoading, refetch } = useConfigurationRules({});
  const { mutateAsync: updateConfigurationRule } = useUpdateConfigurationRule(
    {},
  );

  const updateRule = async (id: string, is_enabled: boolean) => {
    try {
      await updateConfigurationRule({ id, is_enabled });
      toast.success("Updated!");
      refetch();
    } catch {
      toast.error("Error!");
    }
  };

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Product catalog settings</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage global product catalog configuration settings
          </Text>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button>Create</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Create Rules</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <CreateConfigurationRuleForm
                onSuccess={() => {
                  setOpen(false);
                  refetch();
                }}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text>Loading...</Text>}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Rule type</Table.HeaderCell>
              <Table.HeaderCell>Enabled</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {configuration_rules?.map((rule) => (
              <Table.Row key={rule.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <ConfigurationRuleTooltip
                      type={rule.rule_type as RuleType}
                    />
                    {rule.rule_type}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge color={rule.is_enabled ? "green" : "grey"}>
                    {rule.is_enabled ? "True" : "False"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateRule(rule.id!, !rule.is_enabled);
                    }}
                  >
                    {rule.is_enabled ? "Disable" : "Enable"}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Product catalog settings",
});

export default ConfigurationRulesPage;
