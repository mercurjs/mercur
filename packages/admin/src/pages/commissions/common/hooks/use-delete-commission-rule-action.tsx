import { Prompt, toast } from "@medusajs/ui";
import {
  FormExtensionZone,
  useExtendableForm,
  useExtension,
} from "@mercurjs/dashboard-shared";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as zod from "zod";

import { Form } from "../../../../components/common/form";
import { useDeleteCommissionRule } from "../../../../hooks/api/commissions";

const DeleteCommissionRuleSchema = zod.object({});

export const useDeleteCommissionRuleAction = (rule: {
  id: string;
  name: string;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useDeleteCommissionRule(rule.id);

  const hasCustomFields =
    useExtension().getFormFields("commission_rate", "delete").length > 0;

  const form = useExtendableForm({
    schema: DeleteCommissionRuleSchema,
    model: "commission_rate",
    zone: "delete",
    data: rule,
    defaultValues: {},
  });

  const handleOpenChange = (next: boolean) => {
    if (isPending) {
      return;
    }
    if (next) {
      form.reset();
    }
    setOpen(next);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      { additional_data: values.additional_data },
      {
        onSuccess: () => {
          toast.success(t("commissions.delete.successToast"));
          setOpen(false);
          navigate("/settings/commissions");
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  });

  const deleteDialog = (
    <Prompt open={open} onOpenChange={handleOpenChange} variant="danger">
      {/* The dialog portals out, but React still bubbles its clicks to the table row link. */}
      <Prompt.Content onClick={(e) => e.stopPropagation()}>
        <Form {...form}>
          <Prompt.Header className={hasCustomFields ? "pb-6" : undefined}>
            <Prompt.Title>{t("commissions.delete.title")}</Prompt.Title>
            <Prompt.Description>
              {t("commissions.delete.description", {
                name: rule.name,
                defaultValue: `You are about to delete commission rule ${rule.name}. This action cannot be undone.`,
              })}
            </Prompt.Description>
          </Prompt.Header>
          {hasCustomFields ? (
            <div className="border-ui-border-base border-y px-6 py-4">
              <FormExtensionZone
                model="commission_rate"
                zone="delete"
                control={form.control}
                data={rule}
              />
            </div>
          ) : null}
          <Prompt.Footer>
            <Prompt.Cancel disabled={isPending}>
              {t("actions.cancel")}
            </Prompt.Cancel>
            <Prompt.Action
              onClick={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
              disabled={isPending}
            >
              {t("actions.delete")}
            </Prompt.Action>
          </Prompt.Footer>
        </Form>
      </Prompt.Content>
    </Prompt>
  );

  return { handleDelete: () => handleOpenChange(true), deleteDialog };
};
