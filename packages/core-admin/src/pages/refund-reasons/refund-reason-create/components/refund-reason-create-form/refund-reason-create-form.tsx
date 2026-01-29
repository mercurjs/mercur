import { Button, Heading, Input, Text, Textarea, toast } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Form } from "../../../../../components/common/form";
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useCreateRefundReason } from "../../../../../hooks/api";

const RefundReasonCreateSchema = z.object({
  label: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

export const RefundReasonCreateForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof RefundReasonCreateSchema>>({
    defaultValues: {
      label: "",
      code: "",
      description: "",
    },
    resolver: zodResolver(RefundReasonCreateSchema),
  });

  const generateCodeFromLabel = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const { mutateAsync, isPending } = useCreateRefundReason();

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ refund_reason }) => {
        toast.success(
          t("refundReasons.create.successToast", {
            label: refund_reason.label,
          }),
        );
        handleSuccess(`../`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  });

  return (
    <RouteFocusModal.Form form={form} data-testid="refund-reason-create-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header data-testid="refund-reason-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 justify-center overflow-auto px-6 py-16" data-testid="refund-reason-create-form-body">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-1" data-testid="refund-reason-create-form-header-section">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="refund-reason-create-form-heading">{t("refundReasons.create.header")}</Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle" data-testid="refund-reason-create-form-subtitle">
                  {t("refundReasons.create.subtitle")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="label"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="refund-reason-create-form-label-item">
                      <Form.Label data-testid="refund-reason-create-form-label-label">
                        {t("refundReasons.fields.label.label")}
                      </Form.Label>
                      <Form.Control data-testid="refund-reason-create-form-label-control">
                        <Input
                          {...field}
                          placeholder={t(
                            "refundReasons.fields.label.placeholder",
                          )}
                          data-testid="refund-reason-create-form-label-input"
                          onChange={(e) => {
                            if (
                              !form.getFieldState("code").isTouched ||
                              !form.getValues("code")
                            ) {
                              form.setValue(
                                "code",
                                generateCodeFromLabel(e.target.value),
                              );
                            }
                            field.onChange(e);
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="refund-reason-create-form-label-error" />
                    </Form.Item>
                  );
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t("refundReasons.fields.code.label")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t(
                            "refundReasons.fields.code.placeholder",
                          )}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="refund-reason-create-form-description-item">
                    <Form.Label optional data-testid="refund-reason-create-form-description-label">
                      {t("refundReasons.fields.description.label")}
                    </Form.Label>
                    <Form.Control data-testid="refund-reason-create-form-description-control">
                      <Textarea
                        {...field}
                        placeholder={t(
                          "refundReasons.fields.description.placeholder",
                        )}
                        data-testid="refund-reason-create-form-description-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="refund-reason-create-form-description-error" />
                  </Form.Item>
                );
              }}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="refund-reason-create-form-footer">
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" type="button" data-testid="refund-reason-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="refund-reason-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
