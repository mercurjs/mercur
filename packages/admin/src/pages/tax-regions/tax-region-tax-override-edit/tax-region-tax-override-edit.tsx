import type { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { TaxRateRuleReferenceType } from "../common/constants"
import {
  DISPLAY_OVERRIDE_ITEMS_LIMIT,
  TaxRegionTaxOverrideEditForm,
} from "./components/tax-region-tax-override-edit-form"
import type { InitialRuleValues } from "./types"
import type { ExtendedAdminTaxRate } from "@custom-types/tax-rates"
import { useProductTypes, useProducts, useShippingOptions, useTaxRate } from "@hooks/api"
import { RouteDrawer } from "@components/modals"

export const TaxRegionTaxOverrideEdit = () => {
  const { t } = useTranslation()
  const { tax_rate_id } = useParams()

  const { tax_rate, isPending, isError, error } = useTaxRate(tax_rate_id!)

  const { initialValues, isPending: isInitializing } =
    useDefaultRulesValues(tax_rate)

  const ready = !isPending && !!tax_rate && !isInitializing && !!initialValues

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("taxRegions.taxOverrides.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("taxRegions.taxOverrides.edit.hint")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && (
        <TaxRegionTaxOverrideEditForm
          taxRate={tax_rate}
          isCombinable={true}
          initialValues={initialValues}
        />
      )}
    </RouteDrawer>
  )
}

const useDefaultRulesValues = (
  taxRate?: ExtendedAdminTaxRate
): { initialValues: InitialRuleValues; isPending: boolean } => {
  const rules = taxRate?.rules || []

  const idsByReferenceType: {
    [key in TaxRateRuleReferenceType]: string[]
  } = {
    [TaxRateRuleReferenceType.PRODUCT]: [],
    // [TaxRateRuleReferenceType.PRODUCT_COLLECTION]: [],
    // [TaxRateRuleReferenceType.PRODUCT_TAG]: [],
    [TaxRateRuleReferenceType.PRODUCT_TYPE]: [],
    [TaxRateRuleReferenceType.SHIPPING_OPTION]: [],
    // [TaxRateRuleReferenceType.CUSTOMER_GROUP]: [],
  }

  rules
    .sort((a, b) => (a.created_at && b.created_at ? a.created_at.localeCompare(b.created_at) : 0)) // prefer newer rules for display
    .forEach((rule) => {
      const reference = rule.reference
      if (reference in idsByReferenceType) {
        idsByReferenceType[reference as TaxRateRuleReferenceType]?.push(rule.reference_id)
      }
    })

  const productIds = idsByReferenceType[TaxRateRuleReferenceType.PRODUCT]
  const productTypeIds = idsByReferenceType[TaxRateRuleReferenceType.PRODUCT_TYPE]
  const shippingOptionIds = idsByReferenceType[TaxRateRuleReferenceType.SHIPPING_OPTION]

  const queryResults = [
    {
      result: useProducts(
        {
          id:
            productIds.length > DISPLAY_OVERRIDE_ITEMS_LIMIT
              ? productIds.slice(0, DISPLAY_OVERRIDE_ITEMS_LIMIT)
              : productIds,
          limit: DISPLAY_OVERRIDE_ITEMS_LIMIT,
        },
        { enabled: productIds.length > 0 }
      ),
      enabled: productIds.length > 0,
    },
    {
      result: useProductTypes(
        {
          id:
            productTypeIds.length > DISPLAY_OVERRIDE_ITEMS_LIMIT
              ? productTypeIds.slice(0, DISPLAY_OVERRIDE_ITEMS_LIMIT)
              : productTypeIds,
          limit: DISPLAY_OVERRIDE_ITEMS_LIMIT,
        },
        { enabled: productTypeIds.length > 0 }
      ),
      enabled: productTypeIds.length > 0,
    },
    {
      result: useShippingOptions(
        {
          id:
            shippingOptionIds.length > DISPLAY_OVERRIDE_ITEMS_LIMIT
              ? shippingOptionIds.slice(0, DISPLAY_OVERRIDE_ITEMS_LIMIT)
              : shippingOptionIds,
          limit: DISPLAY_OVERRIDE_ITEMS_LIMIT,
        },
        { enabled: shippingOptionIds.length > 0 }
      ),
      enabled: shippingOptionIds.length > 0,
    },
  ]

  if (!taxRate) {
    return { isPending: true, initialValues: { product: [], product_type: [], shipping_option: [] }}
  }

  const isPending = queryResults.some(
    ({ result, enabled }) => enabled && result.isPending
  )

  if (isPending) {
    return { isPending: true, initialValues: { product: [], product_type: [], shipping_option: [] }}
  }

  queryResults.forEach(({ result, enabled }) => {
    if (enabled && result.isError) {
      throw result.error
    }
  })

  const initialRulesValues: InitialRuleValues = {
    [TaxRateRuleReferenceType.PRODUCT]: [],
    [TaxRateRuleReferenceType.PRODUCT_TYPE]: [],
    [TaxRateRuleReferenceType.SHIPPING_OPTION]: [],
  }

  const productsResult = queryResults[0]
  if (productsResult.enabled) {
    // product data is available but TS can't narrow the union type
    const result = productsResult.result as HttpTypes.AdminProductListResponse
    if (result.products) {
      const productMap = new Map(
        result.products.map((product) => [product.id, product.title])
      )
      initialRulesValues.product = 
        idsByReferenceType[TaxRateRuleReferenceType.PRODUCT].map((id) => ({
          value: id,
          label: productMap.get(id) || "",
        }))
    }
  }

  const productTypesResult = queryResults[1]
  if (productTypesResult.enabled) {
    // Product type data is available but TS can't narrow the union type
    const result = productTypesResult.result as HttpTypes.AdminProductTypeListResponse
    if (result.product_types) {
      const productTypeMap = new Map(
        result.product_types.map((type) => [type.id, type.value])
      )
      initialRulesValues.product_type = 
        idsByReferenceType[TaxRateRuleReferenceType.PRODUCT_TYPE].map((id) => ({
          value: id,
          label: productTypeMap.get(id) || "",
        }))
    }
  }

  const shippingOptionsResult = queryResults[2]
  if (shippingOptionsResult.enabled) {
    // shipping option data is available but TS can't narrow the union type
    const result = shippingOptionsResult.result as HttpTypes.AdminShippingOptionListResponse
    if (result.shipping_options) {
      const shippingOptionMap = new Map(
        result.shipping_options.map((option) => [option.id, option.name])
      )
      initialRulesValues.shipping_option = 
        idsByReferenceType[TaxRateRuleReferenceType.SHIPPING_OPTION].map((id) => ({
          value: id,
          label: shippingOptionMap.get(id) || "",
        }))
    }
  }

  return { initialValues: initialRulesValues, isPending: false }
}
