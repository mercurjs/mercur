import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, RadioGroup, Text, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { RouteFocusModal, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useReportReview } from "@hooks/api/reviews";

const REASONS = [
  "irrelevant_content",
  "spam",
  "inappropriate_language",
  "bullying_or_harassment",
  "personal_information",
] as const;

const ReportReviewSchema = zod.object({
  reason: zod.enum(REASONS),
});

export const ReportReviewForm = ({ reviewId }: { reviewId: string }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof ReportReviewSchema>>({
    resolver: zodResolver(ReportReviewSchema),
  });

  const { mutateAsync, isPending } = useReportReview(reviewId);

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      { reason: data.reason },
      {
        onSuccess: () => {
          toast.success(t("reviews.report.successToast"));
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteFocusModal.Header>
          <RouteFocusModal.Title asChild>
            <Heading>{t("reviews.report.header")}</Heading>
          </RouteFocusModal.Title>
          <RouteFocusModal.Description className="sr-only">
            {t("reviews.report.header")}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-8">
          <div className="flex w-full max-w-[720px] flex-col">
            <Form.Field
              control={form.control}
              name="reason"
              render={({ field: { onChange, ...field } }) => (
                <Form.Item>
                  <Form.Control>
                    <RadioGroup
                      onValueChange={onChange}
                      {...field}
                      className="flex flex-col gap-0"
                    >
                      {REASONS.map((reason) => (
                        <label
                          key={reason}
                          htmlFor={`report-reason-${reason}`}
                          className="hover:bg-ui-bg-subtle-hover flex cursor-pointer items-start gap-x-3 border-b px-1 py-4 last:border-b-0"
                          data-testid={`review-report-form-reason-${reason}`}
                        >
                          <RadioGroup.Item
                            id={`report-reason-${reason}`}
                            value={reason}
                            className="mt-0.5"
                          />
                          <div className="flex flex-col">
                            <Text size="small" leading="compact" weight="plus">
                              {t(`reviews.report.reasons.${reason}.label`)}
                            </Text>
                            <Text
                              size="small"
                              leading="compact"
                              className="text-ui-fg-subtle"
                            >
                              {t(`reviews.report.reasons.${reason}.description`)}
                            </Text>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              disabled={!form.watch("reason")}
              data-testid="review-report-form-submit"
            >
              {t("reviews.report.action")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
