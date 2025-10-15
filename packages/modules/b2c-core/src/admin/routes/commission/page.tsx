import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DocumentText } from "@medusajs/icons";
import { Button, Container, Drawer, Heading, Text } from "@medusajs/ui";
import { CommissionDetailTable } from "./components/commission-detail-table";
import { DataTable } from "../../components/table/data-table";
import { useCommissionRulesTableQuery } from "../../hooks/query/use-commission-rules-table-query";
import {
  useCommissionRules,
  useDefaultCommissionRule,
} from "../../hooks/api/commission";
import { useDataTable } from "../../hooks/table/use-data-table";
import { useCommissionRulesTableColumns } from "../../hooks/table/columns/use-commission-rules-table-columns";
import CreateCommissionRuleForm from "./components/create-commission-rule-form";
import { useState } from "react";
import UpsertDefaultCommissionRuleForm from "./components/upsert-default-commission-rule";
import { AdminCommissionAggregate } from "./types";

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
    ...searchParams,
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
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Global Commission Settings</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Manage global commission settings for your marketplace.
            </Text>
          </div>

          <Drawer
            open={upsertDefaultOpen}
            onOpenChange={(openChanged) => setUpsertDefaultOpen(openChanged)}
          >
            <Drawer.Trigger
              onClick={() => {
                setUpsertDefaultOpen(true);
              }}
              asChild
            >
              <Button variant="secondary">Edit</Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Edit default rule</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <UpsertDefaultCommissionRuleForm
                  onSuccess={() => {
                    setUpsertDefaultOpen(false);
                    defaultRule.refetch()
                  }}
                  rule={defaultRule.commission_rule}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </div>

        <CommissionDetailTable commissionRule={defaultRule.commission_rule} />
      </Container>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Commission Rules</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              View, search, and manage existing commission rules.
            </Text>
          </div>
          <Drawer
            open={createRuleOpen}
            onOpenChange={(openChanged) => setCreateRuleOpen(openChanged)}
          >
            <Drawer.Trigger
              onClick={() => {
                setCreateRuleOpen(true);
              }}
              asChild
            >
              <Button variant="secondary">Create</Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Create Rule</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <CreateCommissionRuleForm
                  onSuccess={() => {
                    setCreateRuleOpen(false);
                    refetch();
                  }}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </div>

        <DataTable
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
        />
      </Container>
    </>
  );
};

export const config = defineRouteConfig({
  label: "Commission settings",
  icon: DocumentText,
});

export default Commission;
