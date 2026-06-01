import { MedusaService } from "@medusajs/framework/utils";
import {
  recordDijieAuditSummaryWithRepository,
  retrieveDijieAuditRecordByExecutionIdWithRepository,
  type DijieAuditRecordRepository,
  type DijieAuditRecordLookupRepository,
  type DijieAuditRecordStore,
  type DijieAuditExecutionRecordReader,
} from "../../lib/dijie/audit-store";
import type { DijieAuditRecord as DijieAuditRecordPayload } from "../../lib/dijie/audit-summary";
import { DijieAuditRecord } from "./models";

class DijieAuditModuleService
  extends MedusaService({
    DijieAuditRecord,
  })
  implements DijieAuditRecordStore, DijieAuditExecutionRecordReader
{
  async recordDijieAuditSummary(record: DijieAuditRecordPayload) {
    return recordDijieAuditSummaryWithRepository(
      this as unknown as DijieAuditRecordRepository,
      record,
    );
  }

  async retrieveDijieAuditRecordByExecutionId(executionId: string) {
    return retrieveDijieAuditRecordByExecutionIdWithRepository(
      this as unknown as DijieAuditRecordLookupRepository,
      executionId,
    );
  }
}

export default DijieAuditModuleService;
