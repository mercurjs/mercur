import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  createDijieAuditRecord,
  type DijieAuditRecord,
} from "../../../lib/dijie/audit-summary";
import {
  DIJIE_AUDIT_MODULE,
  type DijieAuditRecordStore,
} from "../../../lib/dijie/audit-store";
import { verifyDijieExecutionToken } from "../../../lib/dijie/execution-token";
import { createDijieRoleTokenUsageLedgerEntryFromAudit } from "../../../lib/dijie/ledgers";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function bearerFromRequest(req: MedusaRequest): string | undefined {
  const authorization = req.headers.authorization;
  if (Array.isArray(authorization)) {
    return undefined;
  }
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isAuditRecordStore(value: unknown): value is DijieAuditRecordStore {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { recordDijieAuditSummary?: unknown })
      .recordDijieAuditSummary === "function"
  );
}

function resolveAuditStore(req: MedusaRequest): DijieAuditRecordStore | undefined {
  try {
    const store = req.scope.resolve(DIJIE_AUDIT_MODULE) as unknown;
    if (isAuditRecordStore(store)) {
      return store;
    }
  } catch {
    // Continue to the legacy name below. Both paths fail closed when absent.
  }

  try {
    const legacyStore = req.scope.resolve("dijieAuditSink") as unknown;
    if (isAuditRecordStore(legacyStore)) {
      return legacyStore;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const publicKeyPem = process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM;
  if (!publicKeyPem?.trim()) {
    return res.status(503).json({
      ok: false,
      error: "DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM is required for audit upload.",
    });
  }

  const executionToken = bearerFromRequest(req);
  if (!executionToken) {
    return res.status(401).json({
      ok: false,
      error: "Dijie audit upload requires a bearer execution token.",
    });
  }

  const verified = verifyDijieExecutionToken(executionToken, publicKeyPem);
  if (!verified.ok) {
    return res.status(401).json({
      ok: false,
      error: verified.error,
    });
  }

  const body = asRecord(req.body);
  const summary = body.auditSummary ?? body.summary ?? body;
  const record = createDijieAuditRecord({
    claims: verified.claims,
    summary,
  });
  if (!record.ok) {
    return res.status(400).json({
      ok: false,
      error: record.error,
    });
  }

  const roleUsageLedger = createDijieRoleTokenUsageLedgerEntryFromAudit(record.record);
  if (!roleUsageLedger.ok) {
    return res.status(400).json({
      ok: false,
      error: roleUsageLedger.error,
    });
  }

  const auditRecord: DijieAuditRecord = {
    ...record.record,
    roleUsageLedger: roleUsageLedger.value,
  };

  const store = resolveAuditStore(req);
  if (!store) {
    return res.status(503).json({
      ok: false,
      error: "Dijie audit record store is not configured.",
    });
  }

  let storeResult: { auditRecordId?: string } | void;
  try {
    storeResult = await store.recordDijieAuditSummary(auditRecord);
  } catch {
    return res.status(502).json({
      ok: false,
      error: "Dijie audit record store failed to persist the audit summary.",
    });
  }

  return res.status(200).json({
    ok: true,
    executionId: auditRecord.summary.executionId,
    auditRecordId: storeResult?.auditRecordId,
    billingSummary: {
      source: "role_usage",
      executionId: roleUsageLedger.value.executionId,
      roleListingId: roleUsageLedger.value.roleListingId,
      packageVersion: roleUsageLedger.value.packageVersion,
      entitlementId: roleUsageLedger.value.entitlementId,
      developerRef: roleUsageLedger.value.developerRef,
      billingBeneficiaryRef: roleUsageLedger.value.billingBeneficiaryRef,
      inputTokens: auditRecord.summary.modelProxyUsage?.inputTokens ?? 0,
      outputTokens: auditRecord.summary.modelProxyUsage?.outputTokens ?? 0,
      currency: roleUsageLedger.value.currency,
      platformReceivableCents: 0,
      developerReceivableCents: roleUsageLedger.value.developerReceivableCents,
    },
  });
}
