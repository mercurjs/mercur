import { useState } from "react";

import { Button, Container, Drawer, Heading, Text } from "@medusajs/ui";

import type { AdminCommissionAggregate } from "@custom-types/commission";

import { _DataTable } from "@components/table/data-table";

import {
  useCommissionRules,
  useDefaultCommissionRule,
} from "@hooks/api/commission";
import { useCommissionRulesTableColumns } from "@hooks/table/columns/use-commission-rules-table-columns";
import { useCommissionRulesTableQuery } from "@hooks/table/query/use-commission-rules-table-query";
import { useDataTable } from "@hooks/use-data-table";

import { CommissionDetailTable } from "./_components/commission-detail-table";
import CreateCommissionRuleForm from "./_components/create-commission-rule-form";
import UpsertDefaultCommissionRuleForm from "./_components/upsert-default-commission-rule";

const PAGE_SIZE = 50;

const Commission = () => {
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [upsertDefaultOpen, setUpsertDefaultOpen] = useState(false);
  const defaultRule = useDefaultCommissionRule();
  const { searchParams, raw } = useCommissionRulesTableQuery({
    pageSize: PAGE_SIZE,
  });
  const {
    commission_rules,
    count,
    isPending: isLoading,
    refetch,
  } = useCommissionRules({
    ...(searchParams as Record<string, string | number>),
  });

  const columns = useCommissionRulesTableColumns({
    onSuccess() {
      refetch();
    },
  });

  const { table } = useDataTable({
    data: (commission_rules ?? []) as AdminCommissionAggregate[],
    columns,
    enablePagination: true,
    getRowId: (row) => row.id!,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <Container className="divide-y p-0" data-testid="commission-global-settings-container">
        <div className="flex items-center justify-between px-6 py-4" data-testid="commission-global-settings-header">
          <div>
            <Heading data-testid="commission-global-settings-heading">Global Commission Settings</Heading>
            <Text className="text-ui-fg-subtle" size="small" data-testid="commission-global-settings-description">
              Manage global commission settings for your marketplace.
            </Text>
          </div>

          <Drawer
            open={upsertDefaultOpen}
            onOpenChange={(openChanged) => setUpsertDefaultOpen(openChanged)}
            data-testid="commission-global-settings-edit-drawer"
          >
            <Drawer.Trigger
              onClick={() => {
                setUpsertDefaultOpen(true);
              }}
              asChild
              data-testid="commission-global-settings-edit-button"
            >
              <Button variant="secondary">Edit</Button>
            </Drawer.Trigger>
            <Drawer.Content data-testid="commission-global-settings-edit-drawer-content">
              <Drawer.Header data-testid="commission-global-settings-edit-drawer-header">
                <Drawer.Title data-testid="commission-global-settings-edit-drawer-title">Edit default rule</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body data-testid="commission-global-settings-edit-drawer-body">
                <UpsertDefaultCommissionRuleForm
                  onSuccess={() => {
                    setUpsertDefaultOpen(false);
                    defaultRule.refetch();
                  }}
                  rule={defaultRule.commission_rule}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </div>

        <CommissionDetailTable commissionRule={defaultRule.commission_rule} />
      </Container>
      <Container className="divide-y p-0" data-testid="commission-rules-container">
        <div className="flex items-center justify-between px-6 py-4" data-testid="commission-rules-header">
          <div>
            <Heading data-testid="commission-rules-heading">Commission Rules</Heading>
            <Text className="text-ui-fg-subtle" size="small" data-testid="commission-rules-description">
              View, search, and manage existing commission rules.
            </Text>
          </div>
          <Drawer
            open={createRuleOpen}
            onOpenChange={(openChanged) => setCreateRuleOpen(openChanged)}
            data-testid="commission-rules-create-drawer"
          >
            <Drawer.Trigger
              onClick={() => {
                setCreateRuleOpen(true);
              }}
              asChild
              data-testid="commission-rules-create-button"
            >
              <Button variant="secondary">Create</Button>
            </Drawer.Trigger>
            <Drawer.Content data-testid="commission-rules-create-drawer-content">
              <Drawer.Header data-testid="commission-rules-create-drawer-header">
                <Drawer.Title data-testid="commission-rules-create-drawer-title">Create Rule</Drawer.Title>
              </Drawer.Header>
                <CreateCommissionRuleForm
                  onSuccess={() => {
                    setCreateRuleOpen(false);
                    refetch();
                  }}
                />
            </Drawer.Content>
          </Drawer>
        </div>

        <_DataTable
          table={table}
          count={count}
          columns={columns}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          filters={[]}
          pagination
          queryObject={raw}
          noRecords={{
            title: "Commission rules",
            message: "No records",
          }}
          data-testid="commission-rules-table"
        />
      </Container>
    </>
  );
};

export const Component = Commission;
