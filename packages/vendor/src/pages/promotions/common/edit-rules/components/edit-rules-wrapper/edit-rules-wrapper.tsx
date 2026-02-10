import {
  CreatePromotionRuleDTO,
  HttpTypes,
  PromotionRuleDTO,
} from "@medusajs/types"
import { useRouteModal } from "@components/modals"
import {
  usePromotionAddRules,
  usePromotionRemoveRules,
  usePromotionUpdateRules,
  useUpdatePromotion,
} from "@hooks/api/promotions"
import { RuleTypeValues } from "../../edit-rules"
import { EditRulesForm } from "../edit-rules-form"
import { EditRulesType } from "../edit-rules-form/form-schema"

type EditPromotionFormProps = {
  promotion: HttpTypes.AdminPromotion
  rules: PromotionRuleDTO[]
  ruleType: RuleTypeValues
}

export const EditRulesWrapper = ({
  promotion,
  rules,
  ruleType,
}: EditPromotionFormProps) => {
  const { handleSuccess } = useRouteModal()
  const { mutateAsync: updatePromotion } = useUpdatePromotion(promotion.id)
  const { mutateAsync: addPromotionRules } = usePromotionAddRules(
    promotion.id,
    ruleType
  )

  const { mutateAsync: removePromotionRules } = usePromotionRemoveRules(
    promotion.id,
    ruleType
  )

  const { mutateAsync: updatePromotionRules, isPending } =
    usePromotionUpdateRules(promotion.id, ruleType)

  const handleSubmit = (
    rulesToRemove?: { id: string; disguised?: boolean; attribute: string }[]
  ) => {
    return async function (data: EditRulesType) {
      const applicationMethodData: Record<string, string | number | null> = {}
      const { rules: allRules = [] } = data
      const disguisedRules = allRules.filter((rule) => rule.disguised)
      const disguisedRulesToRemove =
        rulesToRemove?.filter((r) => r.disguised) || []

      for (const rule of disguisedRules) {
        const value = Array.isArray(rule.values)
          ? rule.values[0] || null
          : rule.values || null

        applicationMethodData[rule.attribute!] =
          rule.field_type === "number" && value ? Number(value) : value
      }

      for (const rule of disguisedRulesToRemove) {
        applicationMethodData[rule.attribute] = null
      }

      const rulesData = allRules.filter((rule) => !rule.disguised)

      const rulesToCreate: CreatePromotionRuleDTO[] = []
      const rulesToUpdate: EditRulesType["rules"] = []

      for (const rule of rulesData) {
        if ("id" in rule && typeof rule.id === "string") {
          rulesToUpdate.push(rule)
        } else {
          const createRule: CreatePromotionRuleDTO = {
            attribute: rule.attribute!,
            operator: rule.operator,
            values: rule.values,
          }
          rulesToCreate.push(createRule)
        }
      }

      if (Object.keys(applicationMethodData).length) {
        await updatePromotion({
          application_method: applicationMethodData,
        })
      }

      if (rulesToCreate.length > 0) {
        const rulesToUpdateIds = rulesToUpdate
          .map((r) => r.id)
          .filter((id): id is string => Boolean(id))
        if (rulesToUpdateIds.length > 0) {
          await removePromotionRules({
            rules: rulesToUpdateIds,
          })
        }

        if (rulesToRemove?.length) {
          const removeIds = rulesToRemove
            .map((r) => r.id)
            .filter((id): id is string => Boolean(id))
          await removePromotionRules({
            rules: removeIds,
          })
        }

        const allRulesToAdd = [
          ...rulesToCreate,
          ...rulesToUpdate.map((rule) => ({
            attribute: rule.attribute!,
            operator: rule.operator,
            values: rule.values,
          })),
        ]
        await addPromotionRules({
          rules: allRulesToAdd,
        })
      } else {
        if (rulesToRemove?.length) {
          const removeIds = rulesToRemove
            .map((r) => r.id)
            .filter((id): id is string => Boolean(id))
          await removePromotionRules({
            rules: removeIds,
          })
        }

        if (rulesToUpdate.length) {
          const updateRules = rulesToUpdate.map((rule) => ({
            id: rule.id!,
            attribute: rule.attribute,
            operator: rule.operator,
            values: rule.values,
          }))
          await updatePromotionRules({
            rules: updateRules,
          })
        }
      }

      handleSuccess()
    }
  }

  return (
    <EditRulesForm
      promotion={promotion}
      rules={rules}
      ruleType={ruleType}
      handleSubmit={handleSubmit}
      isSubmitting={isPending}
    />
  )
}
