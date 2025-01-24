import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DocumentText } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { CommissionDetailTable } from "./components/commission-detail-table";
import { ComissionRuleDTO } from "../../../../modules/comission/types";
import { useCommissionRules } from "../../../hooks/api/commission";
import { CommissionTable } from "./components/commission-table";

const Comission = () => {
  const rule = {
    rate: {
      max_price_set_id: "xxx",
      min_price_set_id: "zzz",
      percentage_rate: 10,
      include_tax: true,
    },
  } as ComissionRuleDTO;

  useCommissionRules();
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
        </div>

        <CommissionDetailTable commissionRule={rule}></CommissionDetailTable>
      </Container>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Commission Rules</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              View, search, and manage existing commission rules.
            </Text>
          </div>
        </div>
        <CommissionTable></CommissionTable>
      </Container>
    </>
  );
};

export const config = defineRouteConfig({
  label: "Commission",
  icon: DocumentText,
});

export default Comission;
