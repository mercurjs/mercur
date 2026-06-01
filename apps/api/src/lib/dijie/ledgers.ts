import {
  normalizeOneTimeAuthorizationPricing,
  normalizeRoleTokenPricing,
  type DijieExecutionTokenPricing,
} from "./execution-token";
import type { DijieAuditRecord } from "./audit-summary";

export type DijieLedgerResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

export type DijieUsageKind =
  | "model_tokens"
  | "tool_execution"
  | "runtime_resource"
  | "download"
  | "install"
  | "other";

export type DijieUsageMeter = {
  name: string;
  quantity: number;
  unit: string;
};

export type DijieUsageLedgerEntry = {
  ledger: "usage";
  source: "main_system_usage";
  entryId: string;
  actorId: string;
  workspaceRef: string;
  usageKind: DijieUsageKind;
  meters: DijieUsageMeter[];
  currency: string;
  grossAmountCents: number;
  platformReceivableCents: number;
  developerReceivableCents: 0;
  occurredAt: string;
};

export type DijieRoleUsageLedgerEntry = {
  ledger: "usage";
  source: "role_usage";
  entryId: string;
  executionId: string;
  actorId: string;
  developerId: string;
  developerRef: string;
  billingBeneficiaryRef: string;
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  entitlementId: string;
  workspaceRef: string;
  usageKind: DijieUsageKind;
  meters: DijieUsageMeter[];
  currency: string;
  grossAmountCents: number;
  platformReceivableCents: 0;
  developerReceivableCents: number;
  occurredAt: string;
};

export type DijieMarketplaceEventKind = "role_authorization";

export type DijieMarketplaceOrderLedgerEntry = {
  ledger: "marketplace_order";
  source: "role_marketplace";
  entryId: string;
  eventKind: DijieMarketplaceEventKind;
  actorId: string;
  developerId: string;
  roleListingId: string;
  entitlementId: string;
  currency: string;
  grossAmountCents: number;
  platformFeeBps: 0;
  platformFeeCents: 0;
  developerReceivableCents: number;
  occurredAt: string;
};

export type DijieDeveloperPayoutLedgerEntry = {
  ledger: "developer_payout";
  source: "role_marketplace";
  entryId: string;
  marketplaceEntryId: string;
  developerId: string;
  roleListingId: string;
  entitlementId: string;
  currency: string;
  amountCents: number;
  status: "pending";
  occurredAt: string;
};

export type DijieMarketplaceRoleLedgerEntries = {
  marketplaceOrder: DijieMarketplaceOrderLedgerEntry;
  developerPayout: DijieDeveloperPayoutLedgerEntry;
};

export type CreateDijieUsageLedgerEntryInput = {
  entryId: string;
  actorId: string;
  workspaceRef: string;
  usageKind: DijieUsageKind;
  meters: DijieUsageMeter[];
  currency: string;
  amountCents: number;
  occurredAt?: string;
};

export type CreateDijieRoleUsageLedgerEntryInput = CreateDijieUsageLedgerEntryInput & {
  executionId: string;
  developerId: string;
  developerRef: string;
  billingBeneficiaryRef: string;
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  entitlementId: string;
};

export type CreateDijieMarketplaceRoleLedgerEntriesInput = {
  entryId: string;
  payoutEntryId: string;
  eventKind: DijieMarketplaceEventKind;
  actorId: string;
  developerId: string;
  roleListingId: string;
  entitlementId: string;
  pricing: DijieExecutionTokenPricing;
  occurredAt?: string;
};

const USAGE_KINDS = new Set<DijieUsageKind>([
  "model_tokens",
  "tool_execution",
  "runtime_resource",
  "download",
  "install",
  "other",
]);

const MARKETPLACE_EVENT_KINDS = new Set<DijieMarketplaceEventKind>([
  "role_authorization",
]);

function nonEmptyString(value: string | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function nonNegativeFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isoTimestamp(value: string | undefined): string {
  return value ?? new Date().toISOString();
}

function validateCommonFields(fields: Record<string, string | undefined>): string | undefined {
  const missing = Object.entries(fields)
    .filter(([, value]) => !nonEmptyString(value))
    .map(([field]) => field);

  return missing.length > 0 ? `Missing required ledger fields: ${missing.join(", ")}` : undefined;
}

export function createDijieUsageLedgerEntry(
  input: CreateDijieUsageLedgerEntryInput,
): DijieLedgerResult<DijieUsageLedgerEntry> {
  const missing = validateCommonFields({
    entryId: input.entryId,
    actorId: input.actorId,
    workspaceRef: input.workspaceRef,
    currency: input.currency,
  });
  if (missing) {
    return { ok: false, error: missing };
  }

  if (!USAGE_KINDS.has(input.usageKind)) {
    return { ok: false, error: "Usage ledger entry has an unsupported usage kind." };
  }

  if (!nonNegativeInteger(input.amountCents)) {
    return { ok: false, error: "Usage ledger amount must be a non-negative integer." };
  }

  if (input.meters.length === 0) {
    return { ok: false, error: "Usage ledger entry requires at least one meter." };
  }

  const invalidMeter = input.meters.find(
    (meter) =>
      !nonEmptyString(meter.name) ||
      !nonEmptyString(meter.unit) ||
      !nonNegativeFiniteNumber(meter.quantity),
  );
  if (invalidMeter) {
    return {
      ok: false,
      error: "Usage ledger meters require name, non-negative quantity, and unit.",
    };
  }

  return {
    ok: true,
    value: {
      ledger: "usage",
      source: "main_system_usage",
      entryId: input.entryId.trim(),
      actorId: input.actorId.trim(),
      workspaceRef: input.workspaceRef.trim(),
      usageKind: input.usageKind,
      meters: input.meters.map((meter) => ({
        name: meter.name.trim(),
        quantity: meter.quantity,
        unit: meter.unit.trim(),
      })),
      currency: input.currency.trim(),
      grossAmountCents: input.amountCents,
      platformReceivableCents: input.amountCents,
      developerReceivableCents: 0,
      occurredAt: isoTimestamp(input.occurredAt),
    },
  };
}

export function createDijieRoleUsageLedgerEntry(
  input: CreateDijieRoleUsageLedgerEntryInput,
): DijieLedgerResult<DijieRoleUsageLedgerEntry> {
  const missing = validateCommonFields({
    entryId: input.entryId,
    executionId: input.executionId,
    actorId: input.actorId,
    developerId: input.developerId,
    developerRef: input.developerRef,
    billingBeneficiaryRef: input.billingBeneficiaryRef,
    roleListingId: input.roleListingId,
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    entitlementId: input.entitlementId,
    workspaceRef: input.workspaceRef,
    currency: input.currency,
  });
  if (missing) {
    return { ok: false, error: missing };
  }

  if (!USAGE_KINDS.has(input.usageKind)) {
    return { ok: false, error: "Role usage ledger entry has an unsupported usage kind." };
  }

  if (!nonNegativeInteger(input.amountCents)) {
    return { ok: false, error: "Role usage amount must be a non-negative integer." };
  }

  if (input.meters.length === 0) {
    return { ok: false, error: "Role usage ledger entry requires at least one meter." };
  }

  const invalidMeter = input.meters.find(
    (meter) =>
      !nonEmptyString(meter.name) ||
      !nonEmptyString(meter.unit) ||
      !nonNegativeFiniteNumber(meter.quantity),
  );
  if (invalidMeter) {
    return {
      ok: false,
      error: "Role usage meters require name, non-negative quantity, and unit.",
    };
  }

  return {
    ok: true,
    value: {
      ledger: "usage",
      source: "role_usage",
      entryId: input.entryId.trim(),
      executionId: input.executionId.trim(),
      actorId: input.actorId.trim(),
      developerId: input.developerId.trim(),
      developerRef: input.developerRef.trim(),
      billingBeneficiaryRef: input.billingBeneficiaryRef.trim(),
      roleListingId: input.roleListingId.trim(),
      packageId: input.packageId.trim(),
      packageVersion: input.packageVersion.trim(),
      entitlementId: input.entitlementId.trim(),
      workspaceRef: input.workspaceRef.trim(),
      usageKind: input.usageKind,
      meters: input.meters.map((meter) => ({
        name: meter.name.trim(),
        quantity: meter.quantity,
        unit: meter.unit.trim(),
      })),
      currency: input.currency.trim(),
      grossAmountCents: input.amountCents,
      platformReceivableCents: 0,
      developerReceivableCents: input.amountCents,
      occurredAt: isoTimestamp(input.occurredAt),
    },
  };
}

function amountCentsForRoleModelUsage(record: DijieAuditRecord): number | undefined {
  const usage = record.summary.modelProxyUsage;
  if (!usage) {
    return undefined;
  }

  const numerator =
    BigInt(usage.inputTokens) * BigInt(record.roleTokenPricing.inputTokenCentsPerMillion) +
    BigInt(usage.outputTokens) * BigInt(record.roleTokenPricing.outputTokenCentsPerMillion);
  const cents = (numerator + 999_999n) / 1_000_000n;
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    return undefined;
  }
  return Number(cents);
}

export function createDijieRoleTokenUsageLedgerEntryFromAudit(
  record: DijieAuditRecord,
): DijieLedgerResult<DijieRoleUsageLedgerEntry> {
  const usage = record.summary.modelProxyUsage;
  if (!usage) {
    return {
      ok: false,
      error: "Role token usage settlement requires AuditSummary.modelProxyUsage.",
    };
  }

  const roleTokenPricing = normalizeRoleTokenPricing(record.roleTokenPricing);
  if (!roleTokenPricing) {
    return {
      ok: false,
      error:
        "Role token usage settlement requires roleTokenPricing with input/output token cents per million, platformFeeBps=0, and developerReceivableBps=10000.",
    };
  }

  const amountCents = amountCentsForRoleModelUsage(record);
  if (amountCents === undefined) {
    return { ok: false, error: "Role token usage amount is outside the supported range." };
  }

  return createDijieRoleUsageLedgerEntry({
    entryId: `role_usage_${record.summary.executionId}`,
    executionId: record.summary.executionId,
    actorId: record.actorId,
    developerId: record.billingBeneficiaryRef,
    developerRef: record.developerRef,
    billingBeneficiaryRef: record.billingBeneficiaryRef,
    roleListingId: record.summary.roleListingId,
    packageId: record.packageId,
    packageVersion: record.packageVersion,
    entitlementId: record.summary.entitlementId,
    workspaceRef: record.summary.workspaceRef,
    usageKind: "model_tokens",
    meters: [
      { name: "request_count", quantity: usage.requestCount, unit: "request" },
      { name: "input_tokens", quantity: usage.inputTokens, unit: "token" },
      { name: "output_tokens", quantity: usage.outputTokens, unit: "token" },
    ],
    currency: roleTokenPricing.currency,
    amountCents,
    occurredAt: record.receivedAt,
  });
}

export function createDijieMarketplaceRoleLedgerEntries(
  input: CreateDijieMarketplaceRoleLedgerEntriesInput,
): DijieLedgerResult<DijieMarketplaceRoleLedgerEntries> {
  const missing = validateCommonFields({
    entryId: input.entryId,
    payoutEntryId: input.payoutEntryId,
    actorId: input.actorId,
    developerId: input.developerId,
    roleListingId: input.roleListingId,
    entitlementId: input.entitlementId,
  });
  if (missing) {
    return { ok: false, error: missing };
  }

  if (!MARKETPLACE_EVENT_KINDS.has(input.eventKind)) {
    return { ok: false, error: "Marketplace ledger entry has an unsupported event kind." };
  }

  const pricing = normalizeOneTimeAuthorizationPricing(input.pricing);
  if (!pricing) {
    return {
      ok: false,
      error:
        "Marketplace role ledger requires one_time_authorization pricing with platformFeeBps = 0 and full developer receivable.",
    };
  }

  const occurredAt = isoTimestamp(input.occurredAt);
  const marketplaceOrder: DijieMarketplaceOrderLedgerEntry = {
    ledger: "marketplace_order",
    source: "role_marketplace",
    entryId: input.entryId.trim(),
    eventKind: input.eventKind,
    actorId: input.actorId.trim(),
    developerId: input.developerId.trim(),
    roleListingId: input.roleListingId.trim(),
    entitlementId: input.entitlementId.trim(),
    currency: pricing.currency,
    grossAmountCents: pricing.authorizationFeeCents,
    platformFeeBps: 0,
    platformFeeCents: 0,
    developerReceivableCents: pricing.developerReceivableCents,
    occurredAt,
  };

  return {
    ok: true,
    value: {
      marketplaceOrder,
      developerPayout: {
        ledger: "developer_payout",
        source: "role_marketplace",
        entryId: input.payoutEntryId.trim(),
        marketplaceEntryId: marketplaceOrder.entryId,
        developerId: marketplaceOrder.developerId,
        roleListingId: marketplaceOrder.roleListingId,
        entitlementId: marketplaceOrder.entitlementId,
        currency: marketplaceOrder.currency,
        amountCents: marketplaceOrder.developerReceivableCents,
        status: "pending",
        occurredAt,
      },
    },
  };
}
