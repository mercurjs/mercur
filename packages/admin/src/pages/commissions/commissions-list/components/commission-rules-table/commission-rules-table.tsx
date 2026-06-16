import { Container } from "@medusajs/ui";

import { CommissionRulesDataTable } from "./commission-rules-data-table";
import { CommissionRulesHeader } from "./commission-rules-header";

export const CommissionRulesTable = () => {
  return (
    <Container className="divide-y p-0">
      <CommissionRulesHeader />
      <CommissionRulesDataTable />
    </Container>
  );
};
