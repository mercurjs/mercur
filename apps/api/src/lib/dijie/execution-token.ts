import crypto from "node:crypto";

export type DijieExecutionTokenPricing = {
  kind: "one_time_authorization";
  authorizationFeeCents: number;
  currency: string;
  platformFeeBps: number;
  developerReceivableCents: number;
};

export type DijieRoleTokenPricing = {
  inputTokenCentsPerMillion: number;
  outputTokenCentsPerMillion: number;
  currency: string;
  developerReceivableBps: 10000;
  platformFeeBps: 0;
};

export type DijieExecutionTokenClaims = {
  iss: "dijie-cloud";
  typ: "dijie_execution";
  executionId: string;
  actorId: string;
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  entitlementId: string;
  deviceId: string;
  workspaceRef: string;
  localGatewayId: string;
  scopes: string[];
  pricing: DijieExecutionTokenPricing;
  roleTokenPricing: DijieRoleTokenPricing;
  iat: number;
  exp: number;
};

export type CreateDijieExecutionTokenInput = Omit<
  DijieExecutionTokenClaims,
  "iss" | "typ" | "iat" | "exp"
> & {
  nowMs?: number;
  ttlSeconds: number;
};

export type DijieExecutionTokenResult =
  | {
      ok: true;
      token: string;
      claims: DijieExecutionTokenClaims;
    }
  | {
      ok: false;
      error: string;
    };

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function normalizePem(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\\n/g, "\n");
  return normalized || undefined;
}

function parsePositiveInteger(value: unknown): number | undefined {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length === value.length && normalized.length > 0 ? normalized : undefined;
}

export function normalizeOneTimeAuthorizationPricing(
  value: unknown,
): DijieExecutionTokenPricing | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (record.kind !== "one_time_authorization") {
    return undefined;
  }

  const authorizationFeeCents = parsePositiveInteger(record.authorizationFeeCents);
  const platformFeeBps = parsePositiveInteger(record.platformFeeBps) ?? 0;
  const developerReceivableCents =
    parsePositiveInteger(record.developerReceivableCents) ?? authorizationFeeCents;
  const currency = typeof record.currency === "string" ? record.currency.trim() : "";

  if (
    authorizationFeeCents === undefined ||
    developerReceivableCents === undefined ||
    platformFeeBps !== 0 ||
    developerReceivableCents !== authorizationFeeCents ||
    currency !== "CNY"
  ) {
    return undefined;
  }

  return {
    kind: "one_time_authorization",
    authorizationFeeCents,
    currency,
    platformFeeBps,
    developerReceivableCents,
  };
}

export function normalizeRoleTokenPricing(value: unknown): DijieRoleTokenPricing | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const inputTokenCentsPerMillion = parsePositiveInteger(
    record.inputTokenCentsPerMillion ??
      record.input_token_cents_per_million ??
      record.inputCentsPerMillion ??
      record.input_cents_per_million,
  );
  const outputTokenCentsPerMillion = parsePositiveInteger(
    record.outputTokenCentsPerMillion ??
      record.output_token_cents_per_million ??
      record.outputCentsPerMillion ??
      record.output_cents_per_million,
  );
  const developerReceivableBps = parsePositiveInteger(
    record.developerReceivableBps ?? record.developer_receivable_bps,
  );
  const platformFeeBps = parsePositiveInteger(record.platformFeeBps ?? record.platform_fee_bps);
  const currency = nonEmptyString(record.currency);

  if (
    inputTokenCentsPerMillion === undefined ||
    outputTokenCentsPerMillion === undefined ||
    developerReceivableBps !== 10000 ||
    platformFeeBps !== 0 ||
    currency !== "CNY"
  ) {
    return undefined;
  }

  return {
    inputTokenCentsPerMillion,
    outputTokenCentsPerMillion,
    currency,
    developerReceivableBps: 10000,
    platformFeeBps: 0,
  };
}

function normalizeClaims(value: unknown): DijieExecutionTokenClaims | undefined {
  const record = asRecord(value);
  if (!record || record.iss !== "dijie-cloud" || record.typ !== "dijie_execution") {
    return undefined;
  }

  const executionId = nonEmptyString(record.executionId);
  const actorId = nonEmptyString(record.actorId);
  const roleListingId = nonEmptyString(record.roleListingId);
  const packageId = nonEmptyString(record.packageId);
  const packageVersion = nonEmptyString(record.packageVersion);
  const developerRef = nonEmptyString(record.developerRef);
  const listingOwnerRef = nonEmptyString(record.listingOwnerRef);
  const billingBeneficiaryRef = nonEmptyString(record.billingBeneficiaryRef);
  const entitlementId = nonEmptyString(record.entitlementId);
  const deviceId = nonEmptyString(record.deviceId);
  const workspaceRef = nonEmptyString(record.workspaceRef);
  const localGatewayId = nonEmptyString(record.localGatewayId);
  const scopes = stringArray(record.scopes);
  const pricing = normalizeOneTimeAuthorizationPricing(record.pricing);
  const roleTokenPricing = normalizeRoleTokenPricing(record.roleTokenPricing);

  if (
    !executionId ||
    !actorId ||
    !roleListingId ||
    !packageId ||
    !packageVersion ||
    !developerRef ||
    !listingOwnerRef ||
    !billingBeneficiaryRef ||
    !entitlementId ||
    !deviceId ||
    !workspaceRef ||
    !localGatewayId ||
    !scopes ||
    !pricing ||
    !roleTokenPricing ||
    !Number.isInteger(record.iat) ||
    !Number.isInteger(record.exp)
  ) {
    return undefined;
  }

  return {
    iss: "dijie-cloud",
    typ: "dijie_execution",
    executionId,
    actorId,
    roleListingId,
    packageId,
    packageVersion,
    developerRef,
    listingOwnerRef,
    billingBeneficiaryRef,
    entitlementId,
    deviceId,
    workspaceRef,
    localGatewayId,
    scopes,
    pricing,
    roleTokenPricing,
    iat: Number(record.iat),
    exp: Number(record.exp),
  };
}

export function createDijieExecutionToken(
  input: CreateDijieExecutionTokenInput,
  privateKeyPem: string | undefined,
): DijieExecutionTokenResult {
  const normalizedPrivateKey = normalizePem(privateKeyPem);
  if (!normalizedPrivateKey) {
    return { ok: false, error: "DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM is required." };
  }
  if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds < 30 || input.ttlSeconds > 900) {
    return { ok: false, error: "Execution token TTL must be between 30 and 900 seconds." };
  }
  const requiredClaims: Array<keyof CreateDijieExecutionTokenInput> = [
    "executionId",
    "actorId",
    "roleListingId",
    "packageId",
    "packageVersion",
    "developerRef",
    "listingOwnerRef",
    "billingBeneficiaryRef",
    "entitlementId",
    "deviceId",
    "workspaceRef",
    "localGatewayId",
  ];
  const missingClaims = requiredClaims.filter((field) => !nonEmptyString(input[field]));
  if (missingClaims.length > 0) {
    return {
      ok: false,
      error: `Execution token claims are missing required fields: ${missingClaims.join(", ")}`,
    };
  }
  const pricing = normalizeOneTimeAuthorizationPricing(input.pricing);
  if (!pricing) {
    return {
      ok: false,
      error:
        "Execution token pricing must be one_time_authorization with platformFeeBps=0 and full developer receivable.",
    };
  }
  const roleTokenPricing = normalizeRoleTokenPricing(input.roleTokenPricing);
  if (!roleTokenPricing) {
    return {
      ok: false,
      error:
        "Execution token roleTokenPricing must define non-negative input/output token cents per million with platformFeeBps=0 and developerReceivableBps=10000.",
    };
  }
  const scopes = stringArray(input.scopes);
  if (!scopes) {
    return { ok: false, error: "Execution token scopes must be a non-empty string array." };
  }

  const issuedAtSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  const claims: DijieExecutionTokenClaims = {
    iss: "dijie-cloud",
    typ: "dijie_execution",
    executionId: input.executionId,
    actorId: input.actorId,
    roleListingId: input.roleListingId,
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    developerRef: input.developerRef,
    listingOwnerRef: input.listingOwnerRef,
    billingBeneficiaryRef: input.billingBeneficiaryRef,
    entitlementId: input.entitlementId,
    deviceId: input.deviceId,
    workspaceRef: input.workspaceRef,
    localGatewayId: input.localGatewayId,
    scopes,
    pricing,
    roleTokenPricing,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + input.ttlSeconds,
  };

  const header = {
    alg: "EdDSA",
    typ: "JWT",
    kid: "dijie-execution-token-v1",
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  let signature: Buffer;
  try {
    signature = crypto.sign(null, Buffer.from(signingInput), normalizedPrivateKey);
  } catch {
    return { ok: false, error: "DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM is invalid." };
  }

  return {
    ok: true,
    token: `${signingInput}.${base64Url(signature)}`,
    claims,
  };
}

export function verifyDijieExecutionToken(
  token: string,
  publicKeyPem: string | undefined,
  nowMs = Date.now(),
): DijieExecutionTokenResult {
  const normalizedPublicKey = normalizePem(publicKeyPem);
  if (!normalizedPublicKey) {
    return { ok: false, error: "DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM is required." };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "Invalid execution token format." };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  let signatureIsValid = false;
  try {
    signatureIsValid = crypto.verify(
      null,
      Buffer.from(signingInput),
      normalizedPublicKey,
      Buffer.from(encodedSignature, "base64url"),
    );
  } catch {
    return { ok: false, error: "DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM is invalid." };
  }
  if (!signatureIsValid) {
    return { ok: false, error: "Invalid execution token signature." };
  }

  try {
    const claims = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const normalizedClaims = normalizeClaims(claims);
    if (!normalizedClaims) {
      return { ok: false, error: "Invalid execution token claims." };
    }
    if (normalizedClaims.exp <= Math.floor(nowMs / 1000)) {
      return { ok: false, error: "Execution token expired." };
    }
    return { ok: true, token, claims: normalizedClaims };
  } catch {
    return { ok: false, error: "Invalid execution token payload." };
  }
}
