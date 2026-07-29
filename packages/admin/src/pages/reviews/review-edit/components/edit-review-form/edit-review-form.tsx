import { Button, Select, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { AdminReview, useUpdateReview } from "../../../../../hooks/api/reviews"

const STATUSES = ["pending", "published", "rejected"] as const
const RATINGS = [1, 2, 3, 4, 5] as const

const EditReviewSchema = zod.object({
  status: zod.enum(STATUSES),
  rating: zod.coerce.number().int().min(1).max(5),
  customer_note: zod.string().max(1000).optional(),
})

export const EditReviewForm = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()

  const form = useForm<zod.infer<typeof EditReviewSchema>>({
    defaultValues: {
      status: review.status,
      rating: review.rating,
      customer_note: review.customer_note ?? "",
    },
    resolver: zodResolver(EditReviewSchema),
  })

  const { mutateAsync, isPending } = useUpdateReview(review.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        status: data.status,
        rating: data.rating,
        customer_note: data.customer_note,
      },
      {
        onSuccess: () => {
          toast.success(t("reviews.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="review-edit-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { ref, onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("reviews.fields.status")}</Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={onChange}
                      dir={direction}
                    >
                      <Select.Trigger
                        ref={ref}
                        data-testid="review-edit-form-status-input"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {STATUSES.map((status) => (
                          <Select.Item key={status} value={status}>
                            {t(`reviews.status.${status}`)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="rating"
              render={({ field: { ref, onChange, value, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("reviews.fields.rating")}</Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      value={value ? String(value) : undefined}
                      onValueChange={(val) => onChange(Number(val))}
                      dir={direction}
                    >
                      <Select.Trigger
                        ref={ref}
                        data-testid="review-edit-form-rating-input"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {RATINGS.map((rating) => (
                          <Select.Item key={rating} value={String(rating)}>
                            {t("reviews.filters.stars", { count: rating })}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="customer_note"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("reviews.fields.content")}</Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      data-testid="review-edit-form-content-input"
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
                data-testid="review-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="review-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
