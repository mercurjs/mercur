import { Module } from "@medusajs/framework/utils";
import { DIJIE_AUDIT_MODULE } from "../../lib/dijie/audit-store";
import DijieAuditModuleService from "./service";

export default Module(DIJIE_AUDIT_MODULE, {
  service: DijieAuditModuleService,
});
