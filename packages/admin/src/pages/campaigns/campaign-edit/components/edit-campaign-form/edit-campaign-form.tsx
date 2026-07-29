import { AdminCampaign } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"
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
})

export const EditCampaignForm = ({ campaign }: EditCampaignFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useExtendableForm({
    schema: EditCampaignSchema,
    model: "campaign",
    zone: "edit",
    data: campaign,
    defaultValues: {
      name: campaign.name || "",
      description: campaign.description || "",
      campaign_identifier: campaign.campaign_identifier || "",
    },
  })

  const { mutateAsync, isPending } = useUpdateCampaign(campaign.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        description: data.description,
        campaign_identifier: data.campaign_identifier,
      },
      {
        onSuccess: () => {
          toast.success(t("campaigns.edit.successToast"))

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
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="campaign-edit-form-description-item">
                    <Form.Label optional data-testid="campaign-edit-form-description-label">{t("fields.description")}</Form.Label>

                    <Form.Control data-testid="campaign-edit-form-description-control">
                      <Input {...field} data-testid="campaign-edit-form-description-input" />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="campaign-edit-form-description-error" />
                  </Form.Item>
                )
              }}
            />

            <FormExtensionZone
              model="campaign"
              zone="edit"
              control={form.control}
              data={campaign}
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
