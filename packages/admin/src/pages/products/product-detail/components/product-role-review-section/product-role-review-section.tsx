import { CheckCircle } from "@medusajs/icons"
import { Button, Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { SectionRow } from "../../../../../components/common/section"
import { useUpdateProduct } from "../../../../../hooks/api/products"

type RoleReviewState = "draft" | "submitted" | "approved" | "rejected"
type RoleListingStatus = "draft" | "proposed" | "published" | "rejected"

type DijieRoleMetadata = Record<string, unknown> & {
  reviewState?: RoleReviewState
  review_state?: RoleReviewState
  listingStatus?: RoleListingStatus
  listing_status?: RoleListingStatus
  packageId?: string
  package_id?: string
  packageVersion?: string
  package_version?: string
  authorizationFeeCents?: number
  pricing?: {
    kind?: string
    authorizationFeeCents?: number
    authorization_fee_cents?: number
    amountCents?: number
    amount_cents?: number
    currency?: string
    platformFeeBps?: number
    platform_fee_bps?: number
    developerReceivableBps?: number
    developer_receivable_bps?: number
    developerReceivableCents?: number
    developer_receivable_cents?: number
  }
  roleTokenPricing?: {
    currency?: string
    inputTokenCentsPerMillion?: number
    input_token_cents_per_million?: number
    inputCentsPerMillion?: number
    input_cents_per_million?: number
    outputTokenCentsPerMillion?: number
    output_token_cents_per_million?: number
    outputCentsPerMillion?: number
    output_cents_per_million?: number
    platformFeeBps?: number
    platform_fee_bps?: number
    developerReceivableBps?: number
    developer_receivable_bps?: number
  }
}

const REVIEW_STATE_LABELS: Record<string, string> = {
  draft: "草稿",
  submitted: "待审核",
  approved: "已通过",
  rejected: "未通过",
}

const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  proposed: "待发布",
  published: "已发布",
  rejected: "未发布",
}

const statusColor = (value?: string) => {
  switch (value) {
    case "approved":
    case "published":
      return "green"
    case "submitted":
    case "proposed":
      return "orange"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

const getRoleMetadata = (product: HttpTypes.AdminProduct) => {
  const metadata = asRecord(product.metadata)
  const role = asRecord(metadata.dijieRole)

  return Object.keys(role).length ? (role as DijieRoleMetadata) : null
}

const getReviewState = (role: DijieRoleMetadata) => {
  return role.reviewState ?? role.review_state ?? "draft"
}

const getListingStatus = (role: DijieRoleMetadata) => {
  return role.listingStatus ?? role.listing_status ?? "draft"
}

const getPackageVersion = (role: DijieRoleMetadata) => {
  return role.packageVersion ?? role.package_version ?? "-"
}

const getPackageId = (role: DijieRoleMetadata) => {
  return role.packageId ?? role.package_id ?? "-"
}

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
  }

  return undefined
}

const isNonNegativeInteger = (value: unknown) => {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
}

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

const readStringArray = (value: unknown) => {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim())
    : []
}

const definedRecord = (record: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  )
}

export const createPublicDijieRoleMetadata = (
  role: DijieRoleMetadata,
  overrides: Partial<Pick<DijieRoleMetadata, "reviewState" | "listingStatus">> = {}
) => {
  const pricing = asRecord(role.pricing)
  const roleTokenPricing = getRoleTokenPricing(role)
  const manifestSummary = asRecord(role.manifestSummary)
  const entrypoint = readString(manifestSummary.entrypoint)
  const publicManifestSummary = definedRecord({
    ...(entrypoint ? { entrypoint } : {}),
    tools: readStringArray(manifestSummary.tools),
    permissions: readStringArray(manifestSummary.permissions),
    sandbox: readString(manifestSummary.sandbox),
    inputs: readStringArray(manifestSummary.inputs),
    outputs: readStringArray(manifestSummary.outputs),
  })

  return definedRecord({
    kind: "role_product",
    protocolVersion: readString(role.protocolVersion, (role as Record<string, unknown>).protocol_version) ?? "2026-05",
    roleListingId: readString(role.roleListingId, (role as Record<string, unknown>).role_listing_id),
    packageId: readString(role.packageId, role.package_id),
    packageVersion: readString(role.packageVersion, role.package_version),
    developerRef: readString(role.developerRef, (role as Record<string, unknown>).developer_ref),
    listingOwnerRef: readString(role.listingOwnerRef, (role as Record<string, unknown>).listing_owner_ref),
    billingBeneficiaryRef: readString(
      role.billingBeneficiaryRef,
      (role as Record<string, unknown>).billing_beneficiary_ref
    ),
    listingStatus: overrides.listingStatus ?? getListingStatus(role),
    reviewState: overrides.reviewState ?? getReviewState(role),
    title: readString(role.title),
    subtitle: readString(role.subtitle),
    description: readString(role.description),
    capabilities: readStringArray(role.capabilities),
    pricing: definedRecord({
      kind: readString(pricing.kind) ?? "one_time_authorization",
      authorizationFeeCents: readNumber(
        pricing.authorizationFeeCents,
        pricing.authorization_fee_cents,
        pricing.amountCents,
        pricing.amount_cents,
        role.authorizationFeeCents
      ),
      currency: readString(pricing.currency) ?? "CNY",
      platformFeeBps: readNumber(pricing.platformFeeBps, pricing.platform_fee_bps),
      developerReceivableBps: readNumber(
        pricing.developerReceivableBps,
        pricing.developer_receivable_bps
      ),
      developerReceivableCents: readNumber(
        pricing.developerReceivableCents,
        pricing.developer_receivable_cents
      ),
    }),
    roleTokenPricing: definedRecord({
      currency: readString(roleTokenPricing.currency) ?? "CNY",
      inputTokenCentsPerMillion: readNumber(
        roleTokenPricing.inputTokenCentsPerMillion,
        roleTokenPricing.input_token_cents_per_million,
        roleTokenPricing.inputCentsPerMillion,
        roleTokenPricing.input_cents_per_million
      ),
      outputTokenCentsPerMillion: readNumber(
        roleTokenPricing.outputTokenCentsPerMillion,
        roleTokenPricing.output_token_cents_per_million,
        roleTokenPricing.outputCentsPerMillion,
        roleTokenPricing.output_cents_per_million
      ),
      platformFeeBps: readNumber(roleTokenPricing.platformFeeBps, roleTokenPricing.platform_fee_bps),
      developerReceivableBps: readNumber(
        roleTokenPricing.developerReceivableBps,
        roleTokenPricing.developer_receivable_bps
      ),
    }),
    scopes: readStringArray(role.scopes),
    ...(Object.keys(publicManifestSummary).length ? { manifestSummary: publicManifestSummary } : {}),
  }) as DijieRoleMetadata
}

const formatAuthorizationFee = (role: DijieRoleMetadata) => {
  const amount =
    role.pricing?.authorizationFeeCents ??
    role.pricing?.authorization_fee_cents ??
    role.pricing?.amountCents ??
    role.pricing?.amount_cents ??
    role.authorizationFeeCents

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "-"
  }

  const currency = role.pricing?.currency ?? "CNY"
  const displayAmount = (amount / 100).toFixed(2)

  return currency === "CNY" ? `¥${displayAmount}` : `${displayAmount} ${currency}`
}

const getRoleTokenPricing = (role: DijieRoleMetadata) => {
  return asRecord(
    role.roleTokenPricing ?? (role as Record<string, unknown>).role_token_pricing
  )
}

const formatCentsPerMillion = (value: unknown, currency: unknown) => {
  if (!isNonNegativeInteger(value)) {
    return "-"
  }

  if (currency === "CNY") {
    return `${value} 分/百万`
  }

  return typeof currency === "string" ? `${value} ${currency}/百万` : "-"
}

const validateRolePricing = (role: DijieRoleMetadata) => {
  const errors: string[] = []
  const pricing = asRecord(role.pricing)
  const roleTokenPricing = getRoleTokenPricing(role)

  const authorizationFeeCents = readNumber(
    pricing.authorizationFeeCents,
    pricing.authorization_fee_cents,
    pricing.amountCents,
    pricing.amount_cents,
    role.authorizationFeeCents
  )
  const authorizationCurrency = pricing.currency ?? "CNY"
  const authorizationPlatformFeeBps = readNumber(
    pricing.platformFeeBps,
    pricing.platform_fee_bps
  )
  const authorizationDeveloperReceivableBps = readNumber(
    pricing.developerReceivableBps,
    pricing.developer_receivable_bps
  )
  const authorizationDeveloperReceivableCents = readNumber(
    pricing.developerReceivableCents,
    pricing.developer_receivable_cents
  )

  if (pricing.kind !== "one_time_authorization") {
    errors.push("一次授权费必须使用 one_time_authorization 定价。")
  }
  if (!isNonNegativeInteger(authorizationFeeCents)) {
    errors.push("一次授权费必须是非负整数分。")
  }
  if (authorizationCurrency !== "CNY") {
    errors.push("一次授权费币种必须是 CNY。")
  }
  if (authorizationPlatformFeeBps !== 0) {
    errors.push("一次授权费平台抽成必须为 0。")
  }
  if (authorizationDeveloperReceivableBps !== 10000) {
    errors.push("一次授权费开发者应收必须为 10000 bps。")
  }
  if (
    authorizationDeveloperReceivableCents !== undefined &&
    authorizationDeveloperReceivableCents !== authorizationFeeCents
  ) {
    errors.push("一次授权费开发者应收金额必须等于授权费。")
  }

  const tokenCurrency = roleTokenPricing.currency
  const inputCentsPerMillion = readNumber(
    roleTokenPricing.inputTokenCentsPerMillion,
    roleTokenPricing.input_token_cents_per_million,
    roleTokenPricing.inputCentsPerMillion,
    roleTokenPricing.input_cents_per_million
  )
  const outputCentsPerMillion = readNumber(
    roleTokenPricing.outputTokenCentsPerMillion,
    roleTokenPricing.output_token_cents_per_million,
    roleTokenPricing.outputCentsPerMillion,
    roleTokenPricing.output_cents_per_million
  )
  const tokenPlatformFeeBps = readNumber(
    roleTokenPricing.platformFeeBps,
    roleTokenPricing.platform_fee_bps
  )
  const tokenDeveloperReceivableBps = readNumber(
    roleTokenPricing.developerReceivableBps,
    roleTokenPricing.developer_receivable_bps
  )

  if (!isNonNegativeInteger(inputCentsPerMillion)) {
    errors.push("输入 Token 单价必须是非负整数。")
  }
  if (!isNonNegativeInteger(outputCentsPerMillion)) {
    errors.push("输出 Token 单价必须是非负整数。")
  }
  if (tokenCurrency !== "CNY") {
    errors.push("岗位 Token 单价币种必须是 CNY。")
  }
  if (tokenPlatformFeeBps !== 0) {
    errors.push("岗位 Token 单价平台抽成必须为 0。")
  }
  if (tokenDeveloperReceivableBps !== 10000) {
    errors.push("岗位 Token 单价开发者应收必须为 10000 bps。")
  }

  return errors
}

export const ProductRoleReviewSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct
}) => {
  const role = getRoleMetadata(product)
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useUpdateProduct(product.id)

  if (!role) {
    return null
  }

  const reviewState = getReviewState(role)
  const listingStatus = getListingStatus(role)
  const canApprove = reviewState === "submitted" && listingStatus === "proposed"
  const pricingErrors = validateRolePricing(role)
  const roleTokenPricing = getRoleTokenPricing(role)
  const tokenCurrency = roleTokenPricing.currency
  const inputCentsPerMillion = readNumber(
    roleTokenPricing.inputTokenCentsPerMillion,
    roleTokenPricing.input_token_cents_per_million,
    roleTokenPricing.inputCentsPerMillion,
    roleTokenPricing.input_cents_per_million
  )
  const outputCentsPerMillion = readNumber(
    roleTokenPricing.outputTokenCentsPerMillion,
    roleTokenPricing.output_token_cents_per_million,
    roleTokenPricing.outputCentsPerMillion,
    roleTokenPricing.output_cents_per_million
  )

  const handleApprove = async () => {
    if (pricingErrors.length > 0) {
      toast.error("岗位商品价格配置不符合发布规则", {
        description: pricingErrors.join(" "),
      })
      return
    }

    const confirmed = await prompt({
      title: "确认通过审核？",
      description: "通过后，这个岗位商品会发布到迭界AI岗位商场。",
      confirmText: "通过并发布",
      cancelText: "取消",
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(
      {
        status: "published" as HttpTypes.AdminProductStatus,
        metadata: {
          ...asRecord(product.metadata),
          dijieRole: createPublicDijieRoleMetadata(role, {
            reviewState: "approved",
            listingStatus: "published",
          }),
        },
      } as any,
      {
        onSuccess: () => {
          toast.success("岗位商品已通过审核并发布")
        },
        onError: (e) => {
          toast.error("岗位商品审核失败", {
            description: e.message,
          })
        },
      }
    )
  }

  return (
    <Container className="divide-y p-0" data-testid="product-role-review-section">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">岗位商品审核</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            只审核公开 listing metadata；开发者模式是主系统同一聊天框内的工作阶段，不保存 modeStage、提示词、聊天记录或私有 workspace 上下文。
          </Text>
        </div>
        {canApprove && (
          <Button
            size="small"
            variant="secondary"
            onClick={handleApprove}
            isLoading={isPending}
            data-testid="product-role-review-approve-button"
          >
            <CheckCircle />
            通过并发布
          </Button>
        )}
      </div>
      <SectionRow
        title="审核状态"
        value={
          <StatusBadge color={statusColor(reviewState)}>
            {REVIEW_STATE_LABELS[reviewState] ?? reviewState}
          </StatusBadge>
        }
      />
      <SectionRow
        title="上架状态"
        value={
          <StatusBadge color={statusColor(listingStatus)}>
            {LISTING_STATUS_LABELS[listingStatus] ?? listingStatus}
          </StatusBadge>
        }
      />
      <SectionRow title="岗位包" value={getPackageId(role)} />
      <SectionRow title="版本" value={getPackageVersion(role)} />
      <SectionRow title="一次授权费" value={formatAuthorizationFee(role)} />
      <SectionRow
        title="岗位 Token 单价"
        value={
          <div className="flex flex-col gap-y-1">
            <Text size="small">
              输入：{formatCentsPerMillion(inputCentsPerMillion, tokenCurrency)}
            </Text>
            <Text size="small">
              输出：{formatCentsPerMillion(outputCentsPerMillion, tokenCurrency)}
            </Text>
          </div>
        }
      />
      <SectionRow
        title="价格校验"
        value={
          pricingErrors.length === 0 ? (
            <StatusBadge color="green">可发布</StatusBadge>
          ) : (
            <div className="flex flex-col gap-y-1">
              <StatusBadge color="red">不可发布</StatusBadge>
              {pricingErrors.map((error) => (
                <Text key={error} size="small" className="text-ui-fg-subtle">
                  {error}
                </Text>
              ))}
            </div>
          )
        }
      />
    </Container>
  )
}
