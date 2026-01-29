import { zodResolver } from "@hookform/resolvers/zod"
import { AdminCampaign } from "@medusajs/types"
import { Button, DatePicker, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateCampaign } from "../../../../../hooks/api/campaigns"

type EditCampaignFormProps = {
  campaign: AdminCampaign
}

const EditCampaignSchema = zod.object({
  name: zod.string(),
  description: zod.string().optional(),
  campaign_identifier: zod.string().optional(),
  starts_at: zod.date().optional(),
  ends_at: zod.date().optional(),
})

export const EditCampaignForm = ({ campaign }: EditCampaignFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditCampaignSchema>>({
    defaultValues: {
      name: campaign.name || "",
      description: campaign.description || "",
      campaign_identifier: campaign.campaign_identifier || "",
      starts_at: campaign.starts_at ? new Date(campaign.starts_at) : undefined,
      ends_at: campaign.ends_at ? new Date(campaign.ends_at) : undefined,
    },
    resolver: zodResolver(EditCampaignSchema),
  })

  const { mutateAsync, isPending } = useUpdateCampaign(campaign.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        description: data.description,
        campaign_identifier: data.campaign_identifier,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
      },
      {
        onSuccess: ({ campaign }) => {
          toast.success(
            t("campaigns.edit.successToast", {
              name: campaign.name,
            })
          )

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="campaign-edit-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body data-testid="campaign-edit-form-body">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-name-item">
                    <Form.Label data-testid="campaign-edit-form-name-label">{t("fields.name")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-name-control">
                      <Input {...field} data-testid="campaign-edit-form-name-input" />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-name-error" />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-description-item">
                    <Form.Label data-testid="campaign-edit-form-description-label">{t("fields.description")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-description-control">
                      <Input {...field} data-testid="campaign-edit-form-description-input" />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-description-error" />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="campaign_identifier"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-identifier-item">
                    <Form.Label data-testid="campaign-edit-form-identifier-label">{t("campaigns.fields.identifier")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-identifier-control">
                      <Input {...field} data-testid="campaign-edit-form-identifier-input" />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-identifier-error" />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="starts_at"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-starts-at-item">
                    <Form.Label data-testid="campaign-edit-form-starts-at-label">{t("campaigns.fields.start_date")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-starts-at-control">
                      <DatePicker
                        granularity="minute"
                        hourCycle={12}
                        shouldCloseOnSelect={false}
                        {...field}
                        data-testid="campaign-edit-form-starts-at-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-starts-at-error" />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="ends_at"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-ends-at-item">
                    <Form.Label data-testid="campaign-edit-form-ends-at-label">{t("campaigns.fields.end_date")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-ends-at-control">
                      <DatePicker
                        granularity="minute"
                        shouldCloseOnSelect={false}
                        {...field}
                        data-testid="campaign-edit-form-ends-at-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-ends-at-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="campaign-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" data-testid="campaign-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="campaign-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
