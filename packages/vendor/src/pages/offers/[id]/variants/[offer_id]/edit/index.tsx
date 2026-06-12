import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import { Form } from "../../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useOffer, useUpdateOffer } from "../../../../../../hooks/api/offers"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../../common/constants"
import { OfferDetail } from "../../../../common/types"

const Schema = z.object({ sku: z.string().min(1).max(64) })
type Values = z.infer<typeof Schema>

/**
 * Edit Offer Variant drawer — **SKU only** (SPEC-009). The design's
 * Manage-inventory / Allow-backorders toggles are intentionally not
 * shipped.
 */
const EditOfferVariantForm = ({ offer }: { offer: OfferDetail }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<Values>({
    defaultValues: { sku: offer.sku ?? "" },
    resolver: zodResolver(Schema),
  })
  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      { sku: values.sku },
      {
        onSuccess: () => {
          toast.success(t("offers.edit.successToast"))
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
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
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
  const { offer, isPending, isError, error } = useOffer(offer_id!, {
    fields: OFFER_VARIANT_DETAIL_FIELDS,
  })

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
