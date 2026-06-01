# 迭界AI真人闭环验收 Runbook

本 runbook 用来验收“岗位 Token 计费 + 真人闭环前置协议”的第一段真实业务链路。它不是自动化测试替代品；目标是让真人用真实账号走完创建、审核、购买、授权、本地执行、审计上传和审计读取，并留下可复查证据。

正式运行本 runbook 前，先完成 OpenClaw 本地端预备清单：`openclaw-base/docs/aics/developer-package-smoke-preflight.md`。该清单只用于 PR/HOTL gate 通过前的准备工作，不能替代正式真人 smoke 证据。

## Scope

本轮必须证明：

- vendor 能创建带 `roleTokenPricing` 的岗位商品。
- admin 只能审核通过合法岗位定价：`currency = CNY`、输入/输出 Token 单价非负、`platformFeeBps = 0`、`developerReceivableBps = 10000`。
- buyer 购买或授权后，云端能从真实订单事实推导 `/dijie/my-roles` 和 `/dijie/execution-token`。
- OpenClaw 本地端用 execution token 执行岗位，生成 `AuditSummary.modelProxyUsage`。
- 云端 `/dijie/audit` 持久化审计记录，并派生 `role_usage` 开发者应收账。
- `GET /dijie/executions/:executionId` 只返回安全计费摘要，不返回 raw token、cloud bearer、provider key、本地绝对路径或模型原始请求/响应。

不在本轮验收：

- 钱包和开发者收益页。
- 正式 entitlement 表。
- 平台抽成策略。
- 终端用户免手填 cloud bearer 的正式账号桥。

## Preconditions

### Cloud / marketplace

准备一套可丢弃的测试账号：

- vendor/developer 账号：用于创建岗位商品。
- admin 账号：用于审核岗位商品。
- buyer/customer 账号：用于购买并执行岗位。

云端 API 需要启用 execution token 签发和审计验签：

```bash
DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED=true
DIJIE_ENTITLEMENT_VERIFY_URL=<cloud-base-url>/dijie/entitlements/verify
DIJIE_ENTITLEMENT_VERIFY_BEARER=<internal bridge bearer>
DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM=<ed25519 private key pem>
DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM=<ed25519 public key pem>
DIJIE_EXECUTION_TOKEN_TTL_SECONDS=300
DIJIE_INTERNAL_BRIDGE_BEARER=<internal bridge bearer>
```

The `dijieAuditRecordStore` Medusa module must be registered. If it is missing, `/dijie/audit` must return 503 and the local run must not report full success.

### OpenClaw local runtime

The AICS/OpenClaw plugin needs the matching public key and cloud URLs:

```json
{
  "aics": {
    "allowWrites": true,
    "executionTokenPublicKeyPem": "<same ed25519 public key pem>",
    "cloudBaseUrl": "<cloud-base-url>",
    "cloudAuditUploadEnabled": true,
    "cloudAuditUploadRequired": true
  }
}
```

The local runtime must have either OpenClaw-native `runEmbeddedAgent` available or an explicit temporary `localExecutorCommand`. Missing execution engine config is a correct failure, not a pass.

Do not paste production credentials into screenshots, docs, commits, role packages, `AuditSummary`, or `RoleResult`. The development-only cloud bearer is request-only evidence and must never be persisted.

## Evidence Sheet

Record these ids during the run:

```text
cloudBaseUrl:
vendor account:
admin account:
buyer actor/customer id:
roleListingId/product id:
packageId:
packageVersion:
developerRef:
listingOwnerRef:
billingBeneficiaryRef:
authorization price:
role token input cents per million:
role token output cents per million:
order id or order_group id:
entitlementId used:
deviceId:
workspaceRef:
localGatewayId:
executionId:
auditRecordId:
developerReceivableCents from role_usage:
```

## Step 1: Vendor Creates Role Listing

Use the vendor UI to create a role product with:

- one-time authorization price in CNY
- input Token price in cents per million
- output Token price in cents per million
- package identity: `packageId` and `packageVersion`
- developer, listing owner, and billing beneficiary refs

Expected result:

- The product metadata includes `metadata.dijieRole.kind = "role_product"`.
- The product metadata contains only public listing metadata; it does not contain `modeStage`, role-builder prompts, chat history, `RoleBuildBrief`, workspace refs, execution ids, raw tokens, or provider secrets.
- `metadata.dijieRole.pricing.kind = "one_time_authorization"`.
- `metadata.dijieRole.pricing.platformFeeBps = 0`.
- `metadata.dijieRole.pricing.developerReceivableBps = 10000`.
- `metadata.dijieRole.roleTokenPricing.currency = "CNY"`.
- `metadata.dijieRole.roleTokenPricing.inputTokenCentsPerMillion` is a non-negative integer.
- `metadata.dijieRole.roleTokenPricing.outputTokenCentsPerMillion` is a non-negative integer.
- `metadata.dijieRole.roleTokenPricing.platformFeeBps = 0`.
- `metadata.dijieRole.roleTokenPricing.developerReceivableBps = 10000`.

Failure checks:

- Try leaving one Token price blank or negative. The listing must not be accepted as a valid executable role.
- Try changing platform fee away from zero through any available surface. Admin review must block publication.

## Step 2: Admin Reviews Listing

Use the admin UI product detail page to review the role section.

Expected result:

- The page displays authorization price and role Token prices.
- The page blocks approval if currency is not `CNY`.
- The page blocks approval if either Token price is negative or missing.
- The page blocks approval if platform fee is not zero.
- The page blocks approval if developer receivable is not 10000 bps.
- Once approved and published, `GET /dijie/roles` includes the listing.

Evidence:

```bash
curl '<cloud-base-url>/dijie/roles'
```

Confirm the role projection includes `pricing` and `roleTokenPricing`, but no secrets, raw package auth, or local absolute paths.

## Step 3: Buyer Purchases Or Authorizes Role

Use the buyer account to purchase the approved role listing through the normal marketplace checkout path.

Expected result:

- The order belongs to the buyer customer.
- The order is paid.
- The order line item references the approved role listing.
- Canceled or unpaid orders do not create an installed role.

Evidence:

Call the installed roles endpoint with the buyer's cloud bearer:

```bash
curl '<cloud-base-url>/dijie/my-roles?workspaceRef=<workspaceRef>&deviceId=<deviceId>' \
  -H 'Authorization: Bearer <buyer-cloud-access-token>'
```

Expected response:

- `ok: true`
- one role with `entitlementId`
- nested `role.roleListingId`
- nested `role.roleTokenPricing`
- no fake role card when the order is missing, unpaid, canceled, or owned by another customer

Use the returned `entitlementId` in later steps. In the current implementation it may be an `order_group.id` or `order.id`.

## Step 4: Request Execution Token

From OpenClaw AICS UI or the Gateway method `dijie.executionToken.request`, request an execution token with:

```text
roleListingId=<approved product id>
entitlementId=<order_group id or order id>
deviceId=<local device id>
workspaceRef=<local workspace ref>
localGatewayId=<local gateway id>
cloud_access_token=<buyer cloud bearer>
```

Equivalent API evidence:

```bash
curl '<cloud-base-url>/dijie/execution-token' \
  -H 'Authorization: Bearer <buyer-cloud-access-token>' \
  -H 'Content-Type: application/json' \
  --data '{
    "roleListingId": "<roleListingId>",
    "entitlementId": "<entitlementId>",
    "deviceId": "<deviceId>",
    "workspaceRef": "<workspaceRef>",
    "localGatewayId": "<localGatewayId>"
  }'
```

Expected response:

- `ok: true`
- `grant.executionId`
- `grant.token`
- `grant.pricing.kind = "one_time_authorization"`
- `grant.pricing.platformFeeBps = 0`
- `grant.pricing.developerReceivableBps = 10000`
- `grant.roleTokenPricing.currency = "CNY"`
- `grant.roleTokenPricing.platformFeeBps = 0`
- `grant.roleTokenPricing.developerReceivableBps = 10000`
- `grant.scopes` includes `role.execute` and `audit.write`

Failure checks:

- Wrong buyer bearer returns 401 or 403.
- Wrong `entitlementId` returns 403.
- Missing product `roleTokenPricing` returns a hard failure.
- Unpaid or canceled order returns a hard failure.
- Missing issuer env returns 503.

## Step 5: Run The Local Role

In OpenClaw, run the role builder through the existing main-system flow, not a second chat box. Developer mode is the current role, work identity, and process stage inside the same primary conversation surface. For the development bridge this may be done from the AICS diagnostics page, but the natural-language entry remains OpenClaw's primary conversation surface.

Required confirmed run fields:

```text
request_zh=<user role build request>
confirm_brief=true
role_build_brief_json=<confirmed brief>
execution_token=<grant.token>
role_listing_id=<grant.roleListingId>
entitlement_id=<grant.entitlementId>
device_id=<grant.deviceId>
workspace_ref=<grant.workspaceRef>
local_gateway_id=<grant.localGatewayId>
```

Expected local result:

- Preflight verifies the Ed25519 signature.
- Preflight rejects expired tokens.
- Preflight rejects missing or invalid `roleTokenPricing`.
- Preflight rejects context mismatch for role listing, entitlement, device, workspace, or local gateway.
- The local executor produces `RoleResult` and `AuditSummary`.
- `AuditSummary.modelProxyUsage` is present.
- If audit upload is required, cloud audit failure makes the local run fail explicitly.

## Step 6: Verify Audit Upload And Billing Summary

Successful audit upload returns:

- `ok: true`
- `executionId`
- `auditRecordId`
- `billingSummary.source = "role_usage"`
- `billingSummary.platformReceivableCents = 0`
- `billingSummary.developerReceivableCents` equals Token usage multiplied by the role Token price snapshot
- `billingSummary.developerRef`
- `billingSummary.billingBeneficiaryRef`

Failure checks:

- Remove `modelProxyUsage` from the summary. `/dijie/audit` must return 400.
- Remove `roleTokenPricing` from the token claims. `/dijie/audit` must return 401 or 400 depending on where validation fails.
- Disable audit store. `/dijie/audit` must return 503.
- Make the store throw. `/dijie/audit` must return 502.

## Step 7: Read Safe Execution Summary

Read the execution with the same buyer cloud bearer:

```bash
curl '<cloud-base-url>/dijie/executions/<executionId>' \
  -H 'Authorization: Bearer <buyer-cloud-access-token>'
```

Expected response:

- `ok: true`
- `execution.executionId`
- `execution.actorId`
- `execution.roleListingId`
- `execution.entitlementId`
- `execution.status`
- `execution.pricing`
- `execution.modelProxyUsage`
- `execution.toolUsage`
- `execution.changedFiles`
- `execution.artifacts`
- `execution.receivedAt`

The response must not include:

- raw execution token
- cloud bearer
- provider key or provider auth
- model raw request or raw response
- raw stdout or stderr
- local absolute paths
- full persisted payload

Failure checks:

- Another buyer's bearer returns 403.
- Missing bearer returns 401.
- Unknown execution returns 404.
- Missing audit store/read source returns 503.

## Pass Criteria

The run passes only when all of these are true:

- A real vendor-created role listing with valid `roleTokenPricing` was approved.
- A real buyer purchase or authorization produced `/dijie/my-roles`.
- `/dijie/execution-token` minted a token from real buyer entitlement facts.
- OpenClaw preflight accepted the token and rejected at least one intentional mismatch.
- Local execution produced `AuditSummary.modelProxyUsage`.
- `/dijie/audit` persisted the record and returned `role_usage` billing summary.
- `GET /dijie/executions/:executionId` returned the safe projection.
- No step used fake success or mock installed roles.
- No screenshot, log, audit record, artifact, or response leaked bearer tokens, execution tokens, provider credentials, or local absolute paths.

## Stop Conditions

Stop the run and fix the product before continuing if:

- A missing `roleTokenPricing` can still be approved or executed.
- A buyer without a paid order can receive an execution token.
- OpenClaw reports success when required audit upload fails.
- Developer Token receivable is zero when model usage is non-zero.
- Platform receivable is non-zero for `role_usage`.
- The safe execution endpoint returns raw token, cloud bearer, provider auth, raw model payload, or local absolute paths.

## After The Run

Do not start wallet or developer earnings UI until this evidence exists:

```text
roleListingId:
entitlementId:
executionId:
auditRecordId:
role_usage developerReceivableCents:
safe execution read verified by buyer:
cross-buyer read rejected:
```

Once the evidence is captured, the next product slice is the developer revenue read model: aggregate authorization fee plus role Token usage into a developer-facing earnings page without changing the zero-platform-fee rule.
