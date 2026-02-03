import { useState } from "react";

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
} from "@hooks/api/configuration";

import CreateConfigurationRuleForm from "./_components/create-rule-form";
import {
  ConfigurationRuleTooltip,
  type RuleType,
} from "./_components/rule-tooltip";

const Configuration = () => {
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
    <Container data-testid="configuration-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="configuration-header">
        <div>
          <Heading data-testid="configuration-heading">Product catalog settings</Heading>
          <Text className="text-ui-fg-subtle" size="small" data-testid="configuration-subtitle">
            Manage global product catalog configuration settings
          </Text>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
          data-testid="configuration-create-drawer"
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button data-testid="configuration-create-button">Create</Button>
          </Drawer.Trigger>
          <Drawer.Content data-testid="configuration-create-drawer-content">
            <Drawer.Header data-testid="configuration-create-drawer-header">
              <Drawer.Title data-testid="configuration-create-drawer-title">Create Rules</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body data-testid="configuration-create-drawer-body">
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
      <div className="flex size-full flex-col overflow-hidden" data-testid="configuration-table-wrapper">
        {isLoading && <Text data-testid="configuration-loading">Loading...</Text>}
        <Table data-testid="configuration-table">
          <Table.Header data-testid="configuration-table-header">
            <Table.Row data-testid="configuration-table-header-row">
              <Table.HeaderCell data-testid="configuration-table-header-rule-type">Rule type</Table.HeaderCell>
              <Table.HeaderCell data-testid="configuration-table-header-enabled">Enabled</Table.HeaderCell>
              <Table.HeaderCell data-testid="configuration-table-header-actions"></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="configuration-table-body">
            {configuration_rules?.map((rule, index) => (
              <Table.Row key={rule.id} data-testid={`configuration-table-row-${index}`}>
                <Table.Cell data-testid={`configuration-table-row-rule-type-${index}`}>
                  <div className="flex items-center gap-2">
                    <ConfigurationRuleTooltip
                      type={rule.rule_type as RuleType}
                    />
                    {rule.rule_type}
                  </div>
                </Table.Cell>
                <Table.Cell data-testid={`configuration-table-row-enabled-${index}`}>
                  <StatusBadge color={rule.is_enabled ? "green" : "grey"} data-testid={`configuration-table-row-status-badge-${index}`}>
                    {rule.is_enabled ? "True" : "False"}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell data-testid={`configuration-table-row-actions-${index}`}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateRule(rule.id!, !rule.is_enabled);
                    }}
                    data-testid={`configuration-table-row-toggle-button-${index}`}
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

export const Component = Configuration;
