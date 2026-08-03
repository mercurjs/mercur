import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, DatePicker, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdatePriceList } from "../../../../../hooks/api/price-lists"

type PriceListConfigurationFormProps = {
  priceList: HttpTypes.AdminPriceList
}

const PriceListConfigurationSchema = z.object({
  ends_at: z.date().nullable(),
  starts_at: z.date().nullable(),
})

export const PriceListConfigurationForm = ({
  priceList,
}: PriceListConfigurationFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof PriceListConfigurationSchema>>({
    defaultValues: {
      ends_at: priceList.ends_at ? new Date(priceList.ends_at) : null,
      starts_at: priceList.starts_at ? new Date(priceList.starts_at) : null,
    },
    resolver: zodResolver(PriceListConfigurationSchema),
  })

  const { mutateAsync } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        starts_at: values.starts_at?.toISOString() || null,
        ends_at: values.ends_at?.toISOString() || null,
      },
      {
        onSuccess: () => {
          toast.success(t("priceLists.configuration.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="price-list-configuration-form">
      <RouteDrawer.Description className="sr-only">
        {t("priceLists.configuration.edit.description")}
      </RouteDrawer.Description>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="price-list-configuration-form-body">
          <Form.Field
            control={form.control}
            name="starts_at"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div className="grid grid-cols-1 gap-3">
                    <Form.Label optional>
                      {t("priceLists.fields.startsAt.label")}
                    </Form.Label>
                    <Form.Control>
                      <DatePicker
                        granularity="minute"
                        shouldCloseOnSelect={false}
                        {...field}
                      />
                    </Form.Control>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="ends_at"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div className="grid grid-cols-1 gap-3">
                    <Form.Label optional>
                      {t("priceLists.fields.endsAt.label")}
                    </Form.Label>
                    <Form.Control>
                      <DatePicker
                        granularity="minute"
                        shouldCloseOnSelect={false}
                        {...field}
                      />
                    </Form.Control>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="shrink-0" data-testid="price-list-configuration-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="price-list-configuration-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" data-testid="price-list-configuration-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
