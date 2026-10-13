import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import {
  AdminReturnRequest,
  useDeclineReturnRequest,
} from "../../../../hooks/api/return-requests"

const DeclineReturnRequestSchema = zod.object({
  decline_reason: zod.string().min(1).max(1000),
  decline_code: zod.string().max(100).optional(),
})

type DeclineReturnRequestFormValues = zod.infer<
  typeof DeclineReturnRequestSchema
>

export const DeclineReturnRequestForm = ({
  returnRequest,
}: {
  returnRequest: AdminReturnRequest
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<DeclineReturnRequestFormValues>({
    resolver: zodResolver(DeclineReturnRequestSchema),
    defaultValues: {
      decline_reason: "",
      decline_code: "",
    },
  })

  const { mutateAsync, isPending } = useDeclineReturnRequest(
    returnRequest.id,
    returnRequest.order_id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        decline_reason: data.decline_reason,
        decline_code: data.decline_code || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("returnRequests.decline.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="decline_reason"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("returnRequests.decline.reason")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="decline_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("returnRequests.decline.code")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
              variant="danger"
              isLoading={isPending}
            >
              {t("returnRequests.decline.action")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
