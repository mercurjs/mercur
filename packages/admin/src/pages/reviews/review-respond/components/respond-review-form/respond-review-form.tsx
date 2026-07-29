import { Button, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { AdminReview, useRespondReview } from "../../../../../hooks/api/reviews"

type RespondReviewFormValues = {
  seller_note: string
}

export const RespondReviewForm = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<RespondReviewFormValues>({
    defaultValues: {
      seller_note: "",
    },
    resolver: zodResolver(
      zod.object({
        seller_note: zod
          .string()
          .min(1, t("reviews.respond.validation"))
          .max(300),
      })
    ),
  })

  const { mutateAsync, isPending } = useRespondReview(review.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      { seller_note: data.seller_note },
      {
        onSuccess: () => {
          toast.success(t("reviews.respond.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="review-respond-form">
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
                      data-testid="review-respond-form-response-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="review-respond-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="review-respond-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
