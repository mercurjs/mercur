import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DocumentText } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { ComissionDetailTable } from "./components/comission-detail-table";
import { ComissionRuleDTO } from "../../../../modules/comission/types";
import { PencilSquare } from "@medusajs/icons";
import { ActionMenu } from "../../../components/common";

const Comission = () => {
  const rule = {
    rate: {
      max_price_set_id: "xxx",
      min_price_set_id: "zzz",
      percentage_rate: 10,
      include_tax: true,
    },
  } as ComissionRuleDTO;
  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Global Comission Settings</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Manage global comission settings for your marketplace.
            </Text>
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: "Edit",
                    to: "edit",
                  },
                ],
              },
            ]}
          />
        </div>

        <ComissionDetailTable comissionRule={rule}></ComissionDetailTable>
      </Container>
    </>
  );
};

export const config = defineRouteConfig({
  label: "Comission",
  icon: DocumentText,
});

export default Comission;
