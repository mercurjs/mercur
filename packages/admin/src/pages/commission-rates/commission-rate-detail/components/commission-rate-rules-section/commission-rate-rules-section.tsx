import { Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useBatchCommissionRules } from "../../../../../hooks/api/commission-rates"
import { CommissionRateDTO, CommissionRuleDTO } from "@mercurjs/types"

type CommissionRateRulesSectionProps = {
  commissionRate: CommissionRateDTO
}

export const CommissionRateRulesSection = ({
  commissionRate,
}: CommissionRateRulesSectionProps) => {
  const { t } = useTranslation()
  const rules = commissionRate.rules ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Rules</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Rules determine which entities this commission rate applies to.
          </Text>
        </div>
      </div>
      {rules.length === 0 ? (
        <div className="flex items-center justify-center px-6 py-8">
          <Text className="text-ui-fg-subtle" size="small">
            No rules configured for this commission rate.
          </Text>
        </div>
      ) : (
        rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            commissionRateId={commissionRate.id}
          />
        ))
      )}
    </Container>
  )
}

const RuleRow = ({
  rule,
  commissionRateId,
}: {
  rule: CommissionRuleDTO
  commissionRateId: string
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: batchRules } = useBatchCommissionRules(commissionRateId)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: "Are you sure you want to remove this rule?",
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await batchRules(
      { delete: [rule.id] },
      {
        onSuccess: () => {
          toast.success("Rule removed successfully")
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-x-3">
        <Badge size="2xsmall">{rule.reference}</Badge>
        <Text size="small" className="text-ui-fg-subtle">
          {rule.reference_id}
        </Text>
      </div>
      <Button variant="transparent" size="small" onClick={handleDelete}>
        <Trash className="text-ui-fg-subtle" />
      </Button>
    </div>
  )
}
