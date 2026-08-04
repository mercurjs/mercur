import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Switch, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import { useLinkQuery } from "@mercurjs/dashboard-shared"

import { Form } from "../../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useOffer, useUpdateOffer } from "../../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"

const Schema = z.object({
  sku: z.string().max(64).optional(),
  manage_inventory: z.boolean(),
  allow_backorder: z.boolean(),
})
type Values = z.infer<typeof Schema>

const EditOfferVariantForm = ({ offer }: { offer: OfferDetail }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<Values>({
    defaultValues: {
      sku: offer.sku ?? "",
      manage_inventory: offer.manage_inventory ?? true,
      allow_backorder: offer.allow_backorder ?? false,
    },
    resolver: zodResolver(Schema),
  })
  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const manageInventory = useWatch({
    control: form.control,
    name: "manage_inventory",
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    // SKU is optional: leave the offer's SKU untouched when the field is blank
    // rather than sending an empty string (the API rejects "" on update).
    const sku = values.sku?.trim()
    await mutateAsync(
      {
        ...(sku ? { sku } : {}),
        manage_inventory: values.manage_inventory,
        allow_backorder: values.manage_inventory
          ? values.allow_backorder
          : false,
      },
      {
        onSuccess: () => {
          toast.success(t("offers.variant.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="offer-variant-edit-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto">
          <Form.Field
            control={form.control}
            name="sku"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("offers.fields.sku")}</Form.Label>
                <Form.Control>
                  <Input maxLength={64} autoComplete="off" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="manage_inventory"
            render={({ field: { value, onChange, ...field } }) => (
              <Form.Item>
                <div className="flex items-start gap-x-3">
                  <Form.Control>
                    <Switch
                      className="rtl:rotate-180 shrink-0"
                      dir="ltr"
                      {...field}
                      checked={value}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          form.setValue("allow_backorder", false)
                        }
                        onChange(checked)
                      }}
                    />
                  </Form.Control>
                  <div className="flex min-w-0 flex-col">
                    <Form.Label>{t("offers.fields.manageInventory")}</Form.Label>
                    <Form.Hint>
                      {t("offers.variant.inventory.manageInventoryHint")}
                    </Form.Hint>
                  </div>
                </div>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="allow_backorder"
            render={({ field: { value, onChange, ...field } }) => (
              <Form.Item>
                <div className="flex items-start gap-x-3">
                  <Form.Control>
                    <Switch
                      className="rtl:rotate-180 shrink-0"
                      dir="ltr"
                      {...field}
                      checked={value}
                      onCheckedChange={onChange}
                      disabled={!manageInventory}
                    />
                  </Form.Control>
                  <div className="flex min-w-0 flex-col">
                    <Form.Label>
                      {t("offers.fields.allowBackorders")}
                    </Form.Label>
                    <Form.Hint>
                      {t("offers.variant.inventory.allowBackordersHint")}
                    </Form.Hint>
                  </div>
                </div>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const OfferVariantEditPage = () => {
  const { offer_id } = useParams()
  const { t } = useTranslation()
  const query = useLinkQuery("offer", OFFER_VARIANT_DETAIL_FIELDS)
  const { offer, isPending, isError, error } = useOffer(offer_id!, query)

  if (isError) throw error
  const ready = !isPending && !!offer

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {`${t("actions.edit")} ${t("offers.detail.offerVariant")}`}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offers.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditOfferVariantForm offer={offer as OfferDetail} />}
    </RouteDrawer>
  )
}

export const Component = OfferVariantEditPage
