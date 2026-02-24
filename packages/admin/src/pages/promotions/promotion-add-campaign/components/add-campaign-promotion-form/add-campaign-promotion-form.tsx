import { zodResolver } from "@hookform/resolvers/zod"
import { AdminCampaign, AdminPromotion } from "@medusajs/types"
import { Button, RadioGroup, toast } from "@medusajs/ui"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdatePromotion } from "../../../../../hooks/api/promotions"
import { CreateCampaignFormFields } from "../../../../campaigns/common/components/create-campaign-form-fields"
import { CampaignDetails } from "./campaign-details"
import { sdk } from "../../../../../lib/client"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { Combobox } from "../../../../../components/inputs/combobox"
import { useCampaign } from "../../../../../hooks/api/campaigns"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

type EditPromotionFormProps = {
  promotion: AdminPromotion
}

const EditPromotionSchema = zod.object({
  campaign_id: zod.string().optional().nullable(),
  campaign_choice: zod.enum(["none", "existing"]).optional(),
})

export const AddCampaignPromotionFields = ({
  form,
  withNewCampaign = true,
  promotionCurrencyCode,
}: {
  form: any
  withNewCampaign?: boolean
  promotionCurrencyCode?: string
}) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()

  const watchCampaignId = useWatch({
    control: form.control,
    name: "campaign_id",
  })

  const watchCampaignChoice = useWatch({
    control: form.control,
    name: "campaign_choice",
  })

  const campaignsCombobox = useComboboxData({
    queryFn: (params) =>
      sdk.admin.campaign.list({
        ...params,
      }),
    queryKey: ["campaigns"],
    getOptions: (data) =>
      data.campaigns.map((campaign) => ({
        label: campaign.name.toUpperCase(),
        value: campaign.id,
        disabled:
          campaign.budget?.currency_code &&
          campaign.budget?.currency_code?.toLowerCase() !==
            promotionCurrencyCode?.toLowerCase(), // also cannot add promotion which doesn't have currency defined to a campaign with a currency amount budget
      })),
  })

  const { campaign: selectedCampaign } = useCampaign(
    watchCampaignId as string,
    undefined,
    {
      enabled: !!watchCampaignId,
    }
  )

  return (
    <div className="flex flex-col gap-y-8" data-testid="promotion-add-campaign-fields">
      <Form.Field
        control={form.control}
        name="campaign_choice"
        render={({ field }) => {
          return (
            <Form.Item data-testid="promotion-add-campaign-form-campaign-choice-item">
              <Form.Label data-testid="promotion-add-campaign-form-campaign-choice-label">{t("promotions.fields.campaign")}</Form.Label>

              <Form.Control data-testid="promotion-add-campaign-form-campaign-choice-control">
                <RadioGroup
                  dir={direction}
                  className="grid grid-cols-1 gap-3"
                  {...field}
                  value={field.value}
                  onValueChange={field.onChange}
                  data-testid="promotion-add-campaign-form-campaign-choice-radio-group"
                >
                  <RadioGroup.ChoiceBox
                    value={"none"}
                    label={t("promotions.form.campaign.none.title")}
                    description={t("promotions.form.campaign.none.description")}
                    data-testid="promotion-add-campaign-form-campaign-choice-option-none"
                  />

                  <RadioGroup.ChoiceBox
                    value={"existing"}
                    label={t("promotions.form.campaign.existing.title")}
                    description={t(
                      "promotions.form.campaign.existing.description"
                    )}
                    data-testid="promotion-add-campaign-form-campaign-choice-option-existing"
                  />

                  {withNewCampaign && (
                    <RadioGroup.ChoiceBox
                      value={"new"}
                      label={t("promotions.form.campaign.new.title")}
                      description={t(
                        "promotions.form.campaign.new.description"
                      )}
                      data-testid="promotion-add-campaign-form-campaign-choice-option-new"
                    />
                  )}
                </RadioGroup>
              </Form.Control>

              <Form.ErrorMessage data-testid="promotion-add-campaign-form-campaign-choice-error" />
            </Form.Item>
          )
        }}
      />

      {watchCampaignChoice === "existing" && (
        <Form.Field
          control={form.control}
          name="campaign_id"
          render={({ field: { onChange, ...field } }) => {
            return (
              <Form.Item data-testid="promotion-add-campaign-form-campaign-id-item">
                <Form.Label tooltip={t("campaigns.fields.campaign_id.hint")} data-testid="promotion-add-campaign-form-campaign-id-label">
                  {t("promotions.form.campaign.existing.title")}
                </Form.Label>

                <Form.Control data-testid="promotion-add-campaign-form-campaign-id-control">
                  <Combobox
                    dir={direction}
                    options={campaignsCombobox.options}
                    searchValue={campaignsCombobox.searchValue}
                    onSearchValueChange={campaignsCombobox.onSearchValueChange}
                    onChange={onChange}
                    {...field}
                    data-testid="promotion-add-campaign-form-campaign-id-combobox"
                  ></Combobox>
                </Form.Control>

                <Form.ErrorMessage data-testid="promotion-add-campaign-form-campaign-id-error" />
              </Form.Item>
            )
          }}
        />
      )}

      {watchCampaignChoice === "new" && (
        <CreateCampaignFormFields form={form} fieldScope="campaign." />
      )}

      <CampaignDetails campaign={selectedCampaign as AdminCampaign} />
    </div>
  )
}

export const AddCampaignPromotionForm = ({
  promotion,
}: EditPromotionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { campaign } = promotion

  const originalId = campaign?.id

  const form = useForm<zod.infer<typeof EditPromotionSchema>>({
    defaultValues: {
      campaign_id: campaign?.id,
      campaign_choice: campaign?.id ? "existing" : "none",
    },
    resolver: zodResolver(EditPromotionSchema),
  })

  const { setValue } = form

  const { mutateAsync, isPending } = useUpdatePromotion(promotion.id)
  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      { campaign_id: data.campaign_id },
      {
        onSuccess: () => {
          toast.success(t("promotions.campaign.edit.successToast"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  const watchCampaignChoice = useWatch({
    control: form.control,
    name: "campaign_choice",
  })

  useEffect(() => {
    if (watchCampaignChoice === "none") {
      setValue("campaign_id", null)
    }

    if (watchCampaignChoice === "existing") {
      setValue("campaign_id", originalId)
    }
  }, [watchCampaignChoice, setValue, originalId])

  return (
    <RouteDrawer.Form form={form} data-testid="promotion-add-campaign-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="size-full overflow-auto" data-testid="promotion-add-campaign-form-body">
          <AddCampaignPromotionFields
            form={form}
            withNewCampaign={false}
            promotionCurrencyCode={promotion.application_method?.currency_code}
          />
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="promotion-add-campaign-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="promotion-add-campaign-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button size="small" type="submit" isLoading={isPending} data-testid="promotion-add-campaign-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
