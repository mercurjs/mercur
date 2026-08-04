import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdatePriceList } from "@hooks/api/price-lists"
import { PriceListCustomerAvailabilitySelector } from "@pages/price-lists/common/components/price-list-customer-availability-selector"

type PriceListCustomerAvailabilityFormProps = {
  priceList: HttpTypes.AdminPriceList
  customerGroups: { id: string; name: string }[]
}

const PriceListCustomerAvailabilitySchema = z.object({
  customer_group_id: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .default([]),
})

export const PriceListCustomerAvailabilityForm = ({
  priceList,
  customerGroups,
}: PriceListCustomerAvailabilityFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof PriceListCustomerAvailabilitySchema>>({
    defaultValues: {
      customer_group_id: customerGroups,
    },
    resolver: zodResolver(PriceListCustomerAvailabilitySchema),
  })

  const { mutateAsync, isPending } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const rules = { ...priceList.rules }

    if (values.customer_group_id.length) {
      rules["customer.groups.id"] = values.customer_group_id.map(
        (group) => group.id
      )
    } else {
      delete rules["customer.groups.id"]
    }

    await mutateAsync(
      { rules },
      {
        onSuccess: () => {
          toast.success(t("priceLists.customerAvailability.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="price-list-customer-availability-form">
      <RouteDrawer.Description className="sr-only">
        {t("priceLists.customerAvailability.edit.description")}
      </RouteDrawer.Description>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="price-list-customer-availability-form-body">
          <div className="flex flex-col gap-y-1">
            <Heading level="h2">
              {t("priceLists.fields.customerAvailability.label")}
            </Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("priceLists.fields.customerAvailability.hint")}
            </Text>
          </div>
          <PriceListCustomerAvailabilitySelector
            control={form.control}
            name="customer_group_id"
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="shrink-0" data-testid="price-list-customer-availability-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="price-list-customer-availability-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="price-list-customer-availability-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
