import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes, PromotionRuleDTO } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RouteDrawer } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { RuleTypeValues } from "../../edit-rules"
import { RulesFormField } from "../rules-form-field"
import { EditRules, EditRulesType } from "./form-schema"

type EditPromotionFormProps = {
  promotion: HttpTypes.AdminPromotion
  rules: PromotionRuleDTO[]
  ruleType: RuleTypeValues
  handleSubmit: any
  isSubmitting: boolean
}

export const EditRulesForm = ({
  promotion,
  ruleType,
  handleSubmit,
  isSubmitting,
}: EditPromotionFormProps) => {
  const { t } = useTranslation()
  const [rulesToRemove, setRulesToRemove] = useState([])
  const rulesToRemoveRef = useRef(rulesToRemove)

  rulesToRemoveRef.current = rulesToRemove

  const form = useForm<EditRulesType>({
    defaultValues: { rules: [], type: promotion.type },
    resolver: zodResolver(EditRules),
  })

  const handleFormSubmit = form.handleSubmit((data) => {
    return handleSubmit(rulesToRemoveRef.current)(data)
  })

  return (
    <RouteDrawer.Form form={form}>
        <KeyboundForm
          onSubmit={handleFormSubmit}
          className="flex flex-col overflow-hidden h-full"
        >
          <RouteDrawer.Body className="flex-1 overflow-y-auto">
            <RulesFormField
              form={form as any}
              ruleType={ruleType}
              setRulesToRemove={setRulesToRemove}
              rulesToRemove={rulesToRemove}
              promotion={promotion}
            />
          </RouteDrawer.Body>

          <RouteDrawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteDrawer.Close asChild>
                <Button size="small" variant="secondary" disabled={isSubmitting}>
                  {t("actions.cancel")}
                </Button>
              </RouteDrawer.Close>

              <Button size="small" type="submit" isLoading={isSubmitting}>
                {t("actions.save")}
              </Button>
            </div>
          </RouteDrawer.Footer>
        </KeyboundForm>
    </RouteDrawer.Form>
  )
}
