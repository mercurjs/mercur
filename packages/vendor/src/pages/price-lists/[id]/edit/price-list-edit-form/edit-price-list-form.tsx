import { HttpTypes } from "@medusajs/types"
import { Button, Input, RadioGroup, Textarea, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdatePriceList } from "@hooks/api/price-lists"
import { useDocumentDirection } from "@hooks/use-document-direction"
import { PriceListStatus, PriceListType } from "../../../common/constants"

type PriceListEditFormProps = {
  priceList: HttpTypes.AdminPriceList
}

const PriceListEditSchema = z.object({
  status: z.nativeEnum(PriceListStatus),
  type: z.nativeEnum(PriceListType),
  title: z.string().min(1),
  description: z.string().optional(),
})

export const PriceListEditForm = ({ priceList }: PriceListEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()
  const form = useExtendableForm({
    schema: PriceListEditSchema,
    model: "price_list",
    zone: "edit",
    data: priceList,
    defaultValues: {
      type: priceList.type as PriceListType,
      title: priceList.title,
      description: priceList.description,
      status: priceList.status as PriceListStatus,
    },
  })

  const { mutateAsync, isPending } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const { additional_data, ...rest } = values
    const payload =
      additional_data && Object.keys(additional_data).length
        ? { ...rest, additional_data }
        : rest

    await mutateAsync(payload, {
      onSuccess: ({ price_list }) => {
        toast.success(
          t("priceLists.edit.successToast", {
            title: price_list.title,
          })
        )

        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="price-list-edit-form">
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-6 overflow-auto" data-testid="price-list-edit-form-body">
          <Form.Field
            control={form.control}
            name="type"
            render={({ field: { onChange, ...field } }) => {
              return (
                <Form.Item data-testid="price-list-edit-form-type-item">
                  <div>
                    <Form.Label data-testid="price-list-edit-form-type-label">{t("priceLists.fields.type.label")}</Form.Label>
                    <Form.Hint data-testid="price-list-edit-form-type-hint">{t("priceLists.fields.type.hint")}</Form.Hint>
                  </div>
                  <Form.Control data-testid="price-list-edit-form-type-control">
                    <RadioGroup
                      dir={direction}
                      {...field}
                      onValueChange={onChange}
                      data-testid="price-list-edit-form-type-radio-group"
                    >
                      <RadioGroup.ChoiceBox
                        value={PriceListType.SALE}
                        label={t("priceLists.fields.type.options.sale.label")}
                        description={t(
                          "priceLists.fields.type.options.sale.description"
                        )}
                        data-testid="price-list-edit-form-type-option-sale"
                      />
                      <RadioGroup.ChoiceBox
                        value={PriceListType.OVERRIDE}
                        label={t(
                          "priceLists.fields.type.options.override.label"
                        )}
                        description={t(
                          "priceLists.fields.type.options.override.description"
                        )}
                        data-testid="price-list-edit-form-type-option-override"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="price-list-edit-form-type-error" />
                </Form.Item>
              )
            }}
          />
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, ...rest } }) => {
                return (
                  <Form.Item data-testid="price-list-edit-form-status-item">
                    <Form.Label data-testid="price-list-edit-form-status-label">
                      {t("priceLists.fields.status.label")}
                    </Form.Label>
                    <Form.Control data-testid="price-list-edit-form-status-control">
                      <RadioGroup
                        dir={direction}
                        onValueChange={onChange}
                        {...rest}
                        data-testid="price-list-edit-form-status-radio-group"
                      >
                        <RadioGroup.ChoiceBox
                          value={PriceListStatus.DRAFT}
                          label={t("priceLists.fields.status.options.draft")}
                          description={t(
                            "priceLists.fields.status.descriptions.draft"
                          )}
                          data-testid="price-list-edit-form-status-option-draft"
                        />
                        <RadioGroup.ChoiceBox
                          value={PriceListStatus.ACTIVE}
                          label={t("priceLists.fields.status.options.active")}
                          description={t(
                            "priceLists.fields.status.descriptions.active"
                          )}
                          data-testid="price-list-edit-form-status-option-active"
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="price-list-edit-form-status-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="price-list-edit-form-title-item">
                    <Form.Label data-testid="price-list-edit-form-title-label">{t("fields.title")}</Form.Label>
                    <Form.Control data-testid="price-list-edit-form-title-control">
                      <Input {...field} data-testid="price-list-edit-form-title-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="price-list-edit-form-title-error" />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="price-list-edit-form-description-item">
                    <Form.Label optional data-testid="price-list-edit-form-description-label">{t("fields.description")}</Form.Label>
                    <Form.Control data-testid="price-list-edit-form-description-control">
                      <Textarea {...field} data-testid="price-list-edit-form-description-input" />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="price-list-edit-form-description-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
          <FormExtensionZone
            model="price_list"
            zone="edit"
            control={form.control}
            data={priceList}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="shrink-0" data-testid="price-list-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="price-list-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="price-list-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
