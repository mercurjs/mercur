import { ArrowDownRightMini } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ClientError } from "@mercurjs/client"
import { CommissionRateDTO } from "@mercurjs/types"
import { useProductTypes } from "../../../../../hooks/api/product-types"
import { useProducts } from "../../../../../hooks/api/products"
import { useShippingOptions } from "../../../../../hooks/api"
import { TaxRateRuleReferenceType } from "../../../../tax-regions/common/constants"

type CommissionRateRulesSectionProps = {
  commissionRate: CommissionRateDTO
}

export const CommissionRateRulesSection = ({
  commissionRate,
}: CommissionRateRulesSectionProps) => {
  const { t } = useTranslation()
  const rules = commissionRate.rules || []

  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.reference]) {
        acc[rule.reference] = []
      }
      acc[rule.reference].push(rule.reference_id)
      return acc
    },
    {} as Record<string, string[]>
  )

  const entries = Object.entries(groupedRules)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t("taxRegions.fields.targets.label")}
        </Heading>
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            No rules configured
          </Text>
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="flex items-center gap-x-3">
            <div className="text-ui-fg-muted flex size-5 items-center justify-center">
              <ArrowDownRightMini />
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {t("taxRegions.fields.targets.operators.on")}
              </Text>
              {entries.map(([reference, ids], index) => {
                return (
                  <div
                    key={reference}
                    className="flex items-center gap-x-1.5"
                  >
                    <Reference
                      reference={reference as TaxRateRuleReferenceType}
                      ids={ids}
                    />
                    {index < entries.length - 1 && (
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {t("taxRegions.fields.targets.operators.and")}
                      </Text>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

const Reference = ({
  reference,
  ids,
}: {
  reference: TaxRateRuleReferenceType
  ids: string[]
}) => {
  return (
    <div className="flex items-center gap-x-1.5">
      <ReferenceBadge reference={reference} />
      <ReferenceValues type={reference} ids={ids} />
    </div>
  )
}

const ReferenceBadge = ({
  reference,
}: {
  reference: TaxRateRuleReferenceType
}) => {
  const { t } = useTranslation()
  let label: string | null = null

  switch (reference) {
    case TaxRateRuleReferenceType.PRODUCT:
      label = t("taxRegions.fields.targets.tags.product")
      break
    case TaxRateRuleReferenceType.PRODUCT_TYPE:
      label = t("taxRegions.fields.targets.tags.productType")
      break
    case TaxRateRuleReferenceType.SHIPPING_OPTION:
      label = t("taxRegions.fields.targets.tags.shippingOption")
      break
  }

  if (!label) {
    return null
  }

  return <Badge size="2xsmall">{label}</Badge>
}

const ReferenceValues = ({
  type,
  ids,
}: {
  type: TaxRateRuleReferenceType
  ids: string[]
}) => {
  const { t } = useTranslation()

  const { isPending, additional, labels, isError, error } = useReferenceValues(
    type,
    ids
  )

  if (isError) {
    throw error
  }

  if (isPending) {
    return (
      <div className="bg-ui-tag-neutral-bg border-ui-tag-neutral-border h-5 w-14 animate-pulse rounded-md" />
    )
  }

  return (
    <Tooltip
      content={
        <ul>
          {labels?.map((label: string, index) => (
            <li key={index}>{label}</li>
          ))}
          {additional > 0 && (
            <li>
              {t("taxRegions.fields.targets.additionalValues", {
                count: additional,
              })}
            </li>
          )}
        </ul>
      }
    >
      <Badge size="2xsmall">
        {t("taxRegions.fields.targets.values", {
          count: ids.length,
        })}
      </Badge>
    </Tooltip>
  )
}

const useReferenceValues = (
  type: TaxRateRuleReferenceType,
  ids: string[]
): {
  labels: string[] | undefined
  isPending: boolean
  additional: number
  isError: boolean
  error: ClientError | null
} => {
  const products = useProducts(
    { id: ids, limit: 10 },
    { enabled: !!ids.length && type === TaxRateRuleReferenceType.PRODUCT }
  )

  const productTypes = useProductTypes(
    { id: ids, limit: 10 },
    { enabled: !!ids.length && type === TaxRateRuleReferenceType.PRODUCT_TYPE }
  )

  const shippingOptions = useShippingOptions(
    { id: ids, limit: 10 },
    {
      enabled:
        !!ids.length && type === TaxRateRuleReferenceType.SHIPPING_OPTION,
    }
  )

  switch (type) {
    case TaxRateRuleReferenceType.PRODUCT:
      return {
        labels: products.products?.map((product) => product.title),
        isPending: products.isPending,
        additional:
          products.products && products.count
            ? products.count - products.products.length
            : 0,
        isError: products.isError,
        error: products.error,
      }
    case TaxRateRuleReferenceType.PRODUCT_TYPE:
      return {
        labels: productTypes.product_types?.map((type) => type.value),
        isPending: productTypes.isPending,
        additional:
          productTypes.product_types && productTypes.count
            ? productTypes.count - productTypes.product_types.length
            : 0,
        isError: productTypes.isError,
        error: productTypes.error,
      }
    case TaxRateRuleReferenceType.SHIPPING_OPTION:
      return {
        labels: shippingOptions.shipping_options?.map((option) => option.name),
        isPending: shippingOptions.isPending,
        additional: shippingOptions.count
          ? shippingOptions.count -
            (shippingOptions.shipping_options?.length || 0)
          : 0,
        isError: shippingOptions.isError,
        error: shippingOptions.error,
      }
  }
}
