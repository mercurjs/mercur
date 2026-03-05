import { Children, ReactNode, useEffect, useMemo } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import type {
  ApplicationMethodAllocationValues,
  ApplicationMethodTargetTypeValues,
  ApplicationMethodTypeValues,
  PromotionRuleOperatorValues,
  PromotionStatusValues,
  PromotionTypeValues,
} from "@medusajs/types"
import { toast } from "@medusajs/ui"
import { DeepPartial, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { useCreatePromotion } from "../../../../../hooks/api/promotions"
import { DEFAULT_CAMPAIGN_VALUES } from "../../../../campaigns/common/constants"
import { CreatePromotionSchema, CreatePromotionSchemaType } from "./form-schema"
import { PromotionCampaignTab } from "./promotion-campaign-tab"
import { PromotionDetailsTab } from "./promotion-details-tab"
import { PromotionTemplateTab } from "./promotion-template-tab"
import { templates } from "./templates"

const PROMOTION_CREATE_DEFAULTS = {
  campaign_id: undefined,
  template_id: templates[0].id!,
  campaign_choice: "none" as const,
  is_automatic: "false",
  code: "",
  type: "standard" as PromotionTypeValues,
  status: "draft" as PromotionStatusValues,
  rules: [],
  is_tax_inclusive: false,
  application_method: {
    allocation: "each" as ApplicationMethodAllocationValues,
    type: "fixed" as ApplicationMethodTypeValues,
    target_type: "items" as ApplicationMethodTargetTypeValues,
    max_quantity: 1,
    target_rules: [],
    buy_rules: [],
  },
  campaign: undefined,
}

type CreatePromotionFormProps = {
  children?: ReactNode
  schema?: z.ZodType<CreatePromotionSchemaType>
  defaultValues?: DeepPartial<CreatePromotionSchemaType>
}

export function CreatePromotionForm({
  children,
  schema,
  defaultValues: extraDefaults,
}: CreatePromotionFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreatePromotionSchemaType>({
    defaultValues: {
      ...PROMOTION_CREATE_DEFAULTS,
      ...extraDefaults,
    },
    resolver: zodResolver(schema ?? CreatePromotionSchema),
  })
  const { setValue, reset, getValues } = form

  const { mutateAsync: createPromotion, isPending: isLoading } =
    useCreatePromotion()

  const handleSubmit = form.handleSubmit(
    async (data) => {
      if (data.campaign_choice === "existing" && !data.campaign_id) {
        form.setError("campaign_id", {
          message: t("promotions.errors.requiredField"),
        })
        return
      }
      const {
        campaign_choice: _campaignChoice,
        is_automatic,
        is_tax_inclusive,
        template_id: _templateId,
        application_method,
        rules,
        ...promotionData
      } = data
      const {
        target_rules: targetRulesData = [],
        buy_rules: buyRulesData = [],
        ...applicationMethodData
      } = application_method
      const allocationTyped =
        applicationMethodData.allocation as ApplicationMethodAllocationValues

      const disguisedRules = [
        ...targetRulesData.filter((r) => !!r.disguised),
        ...buyRulesData.filter((r) => !!r.disguised),
        ...rules.filter((r) => !!r.disguised),
      ]

      const applicationMethodRuleData: Record<
        string,
        string | number | string[]
      > = {}

      for (const rule of disguisedRules) {
        applicationMethodRuleData[rule.attribute] =
          rule.field_type === "number"
            ? parseInt(rule.values as string)
            : rule.values
      }

      const buildRulesData = (
        rules: {
          operator: string
          attribute: string
          values: string[] | string | number
          disguised?: boolean
        }[]
      ) => {
        return rules
          .filter((r) => !r.disguised)
          .map((rule) => ({
            operator: rule.operator as PromotionRuleOperatorValues,
            attribute: rule.attribute,
            values: rule.values as string | string[],
          }))
      }

      if (data.campaign) {
        data.campaign.budget.attribute =
          data.campaign.budget.attribute || null
        data.campaign.budget.type = data.campaign.budget.attribute
          ? "use_by_attribute"
          : data.campaign.budget.type
      }

      await createPromotion(
        {
          ...promotionData,
          rules: buildRulesData(rules),
          application_method: {
            ...applicationMethodData,
            allocation: allocationTyped,
            ...applicationMethodRuleData,
            value: parseFloat(applicationMethodData.value as string) as number,
            target_rules: buildRulesData(targetRulesData),
            buy_rules: buildRulesData(buyRulesData),
            max_quantity:
              allocationTyped === "across"
                ? undefined
                : applicationMethodData.max_quantity,
          },
          is_tax_inclusive,
          is_automatic: is_automatic === "true",
        },
        {
          onSuccess: ({ promotion }) => {
            toast.success(
              t("promotions.toasts.promotionCreateSuccess", {
                code: promotion.code,
              })
            )

            handleSuccess(`/promotions/${promotion.id}`)
          },
          onError: (e) => {
            toast.error(e.message)
          },
        }
      )
    },
    async (error) => {
      const { campaign: _campaign, ...rest } = error || {}
      const errorInPromotionTab = !!Object.keys(rest || {}).length

      if (errorInPromotionTab) {
        toast.error(t("promotions.errors.promotionTabError"))
      }
    }
  )

  // Template selection: reset form and apply template defaults
  const watchTemplateId = useWatch({
    control: form.control,
    name: "template_id",
  })

  const currentTemplate = useMemo(() => {
    const currentTemplate = templates.find(
      (template) => template.id === watchTemplateId
    )

    if (!currentTemplate) {
      return
    }

    reset({
      ...PROMOTION_CREATE_DEFAULTS,
      ...extraDefaults,
      template_id: watchTemplateId,
    })

    for (const [key, value] of Object.entries(currentTemplate.defaults)) {
      if (typeof value === "object") {
        for (const [subKey, subValue] of Object.entries(
          value as Record<string, unknown>
        )) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(`application_method.${subKey}` as any, subValue as any)
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(key as any, value as any)
      }
    }

    return currentTemplate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTemplateId, setValue, reset])

  // Campaign choice effects
  const watchCampaignChoice = useWatch({
    control: form.control,
    name: "campaign_choice",
  })

  useEffect(() => {
    const formData = getValues()

    if (watchCampaignChoice !== "existing") {
      setValue("campaign_id", undefined)
      form.clearErrors("campaign_id")
    }

    if (watchCampaignChoice !== "new") {
      setValue("campaign", undefined)
    }

    if (watchCampaignChoice === "new") {
      if (!formData.campaign || !formData.campaign?.budget?.type) {
        setValue("campaign", {
          ...DEFAULT_CAMPAIGN_VALUES,
          budget: {
            ...DEFAULT_CAMPAIGN_VALUES.budget,
            type: DEFAULT_CAMPAIGN_VALUES.budget.type as "spend" | "usage" | "use_by_attribute",
            currency_code: formData.application_method.currency_code,
          },
        })
      }
    }
  }, [watchCampaignChoice, getValues, setValue, form])

  // Currency rule syncing
  const watchRules = useWatch({
    control: form.control,
    name: "rules",
  })

  const watchCurrencyRule = watchRules.find(
    (rule) => rule.attribute === "currency_code"
  )

  if (watchCurrencyRule) {
    const formData = form.getValues()
    const currencyCode = formData.application_method.currency_code
    const ruleValue = watchCurrencyRule.values

    if (!Array.isArray(ruleValue) && currencyCode !== ruleValue) {
      form.setValue("application_method.currency_code", ruleValue as string)
    }
  }

  const defaultTabs = useMemo(
    () => [
      <PromotionTemplateTab key="type" />,
      <PromotionDetailsTab key="promotion" currentTemplate={currentTemplate} />,
      <PromotionCampaignTab key="campaign" />,
    ],
    [currentTemplate]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}

export type { CreatePromotionSchemaType }
