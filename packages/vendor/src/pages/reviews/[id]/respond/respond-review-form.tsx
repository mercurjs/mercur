import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Textarea, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useRespondReview } from "@hooks/api/reviews";

type RespondReviewFormValues = {
  seller_note: string;
};

export const RespondReviewForm = ({ reviewId }: { reviewId: string }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const prompt = usePrompt();

  const form = useForm<RespondReviewFormValues>({
    resolver: zodResolver(
      zod.object({
        seller_note: zod
          .string()
          .min(1, t("reviews.respond.validation"))
          .max(300),
      }),
    ),
    defaultValues: {
      seller_note: "",
    },
  });

  const { mutateAsync, isPending } = useRespondReview(reviewId);

  const handleSubmit = form.handleSubmit(async (data) => {
    const confirmed = await prompt({
      title: t("reviews.respond.confirmTitle"),
      description: t("reviews.respond.confirmDescription"),
      confirmText: t("actions.save"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    });

    if (!confirmed) {
      return;
    }

    await mutateAsync(
      { seller_note: data.seller_note },
      {
        onSuccess: () => {
          toast.success(t("reviews.respond.successToast"));
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="seller_note"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("reviews.respond.label")}</Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      data-testid="review-respond-form-textarea"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="review-respond-form-submit"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
