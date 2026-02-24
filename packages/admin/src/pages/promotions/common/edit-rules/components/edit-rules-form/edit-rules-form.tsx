import { useState } from "react";

import { PromotionDTO, PromotionRuleDTO } from "@medusajs/types";
import { Button } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "../../../../../../components/modals";
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form";
import { RuleTypeValues } from "../../edit-rules";
import { RulesFormField } from "../rules-form-field";
import { EditRules, EditRulesType } from "./form-schema";

type EditPromotionFormProps = {
  promotion: PromotionDTO;
  rules: PromotionRuleDTO[];
  ruleType: RuleTypeValues;
  handleSubmit: any;
  isSubmitting: boolean;
};

export const EditRulesForm = ({
  promotion,
  ruleType,
  handleSubmit,
  isSubmitting,
}: EditPromotionFormProps) => {
  const { t } = useTranslation();
  const [rulesToRemove, setRulesToRemove] = useState([]);

  const form = useForm<EditRulesType>({
    defaultValues: {
      rules: [],
      type: promotion.type,
      application_method: {
        target_type: promotion.application_method?.target_type,
      },
    },
    resolver: zodResolver(EditRules),
  });

  const handleFormSubmit = form.handleSubmit(handleSubmit(rulesToRemove));

  return (
    <RouteDrawer.Form
      form={form}
      data-testid={`promotion-edit-rules-form-${ruleType}`}
    >
      <KeyboundForm
        onSubmit={handleFormSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body
          data-testid={`promotion-edit-rules-form-body-${ruleType}`}
          className="flex-1 overflow-y-auto"
        >
          <RulesFormField
            form={form as any}
            ruleType={ruleType}
            setRulesToRemove={setRulesToRemove}
            rulesToRemove={rulesToRemove}
            promotion={promotion}
            formType="edit"
          />
        </RouteDrawer.Body>

        <RouteDrawer.Footer
          data-testid={`promotion-edit-rules-form-footer-${ruleType}`}
        >
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                disabled={isSubmitting}
                data-testid={`promotion-edit-rules-form-cancel-button-${ruleType}`}
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              size="small"
              type="submit"
              isLoading={isSubmitting}
              data-testid={`promotion-edit-rules-form-save-button-${ruleType}`}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
