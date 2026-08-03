import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Select, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { useUpdatePriceList } from "../../../../../hooks/api/price-lists"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { sdk } from "../../../../../lib/client"

type PriceListCustomerAvailabilityFormProps = {
  priceList: HttpTypes.AdminPriceList
  customerGroups: { id: string; name: string }[]
}

const PriceListCustomerAvailabilitySchema = z.object({
  customer_group_ids: z.array(z.string()).default([]),
})

export const PriceListCustomerAvailabilityForm = ({
  priceList,
  customerGroups,
}: PriceListCustomerAvailabilityFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()

  const form = useForm<z.infer<typeof PriceListCustomerAvailabilitySchema>>({
    defaultValues: {
      customer_group_ids: customerGroups.map((group) => group.id),
    },
    resolver: zodResolver(PriceListCustomerAvailabilitySchema),
  })

  const groups = useComboboxData({
    queryKey: ["price-list-customer-groups"],
    queryFn: (params) => sdk.admin.customerGroups.query(params),
    getOptions: (data) =>
      data.customer_groups.map((group) => ({
        label: group.name!,
        value: group.id,
      })),
    defaultValue: customerGroups.map((group) => group.id),
    defaultValueKey: "id",
  })

  const { mutateAsync } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const rules = { ...priceList.rules }

    if (values.customer_group_ids.length) {
      rules["customer.groups.id"] = values.customer_group_ids
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
          <Text size="small" className="text-ui-fg-subtle">
            {t("priceLists.fields.customerAvailability.hint")}
          </Text>
          <Form.Field
            control={form.control}
            name="customer_group_ids"
            render={({ field: { ref, onChange, ...field } }) => (
              <Form.Item>
                <div className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-2 rounded-xl border p-2 md:flex-row">
                  <Select disabled value="customer_group" dir={direction}>
                    <Select.Trigger className="bg-ui-bg-base md:basis-1/3" data-testid="price-list-customer-availability-attribute">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="customer_group">
                        {t("priceLists.fields.customerAvailability.attribute")}
                      </Select.Item>
                    </Select.Content>
                  </Select>
                  <Select disabled value="in" dir={direction}>
                    <Select.Trigger className="bg-ui-bg-base md:basis-1/6" data-testid="price-list-customer-availability-operator">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="in">{t("operators.in")}</Select.Item>
                    </Select.Content>
                  </Select>
                  <div className="md:basis-1/2">
                    <Form.Control>
                      <Combobox
                        {...field}
                        {...groups}
                        ref={ref}
                        onChange={onChange}
                        placeholder={t("labels.selectValues")}
                        className="bg-ui-bg-base"
                        data-testid="price-list-customer-availability-values"
                      />
                    </Form.Control>
                  </div>
                </div>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="shrink-0" data-testid="price-list-customer-availability-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="price-list-customer-availability-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" data-testid="price-list-customer-availability-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
