import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  DatePicker,
  Divider,
  toast,
} from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdatePriceList } from "@hooks/api/price-lists"

type PriceListConfigurationFormProps = {
  priceList: HttpTypes.AdminPriceList
  customerGroups: { id: string; name: string }[]
}

const PriceListConfigurationSchema = z.object({
  ends_at: z.date().nullable(),
  starts_at: z.date().nullable(),
  customer_group_id: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
})



export const PriceListConfigurationForm = ({
  priceList,
  customerGroups,
}: PriceListConfigurationFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  

  const form = useForm<z.infer<typeof PriceListConfigurationSchema>>({
    defaultValues: {
      ends_at: priceList.ends_at ? new Date(priceList.ends_at) : null,
      starts_at: priceList.starts_at ? new Date(priceList.starts_at) : null,
      customer_group_id: customerGroups,
    },
    resolver: zodResolver(PriceListConfigurationSchema),
  })

  const { remove: _remove } = useFieldArray({
    control: form.control,
    name: "customer_group_id",
    keyName: "cg_id",
  })

  

  const { mutateAsync } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const rules = { ...priceList.rules } // preserve other rules set on the PL

    /* TODO: Customer group availability - vendor API does not support customer groups yet
    const groupIds = values.customer_group_id.map((group) => group.id)
    if (groupIds.length) {
      rules["customer.groups.id"] = groupIds
    } else {
      delete rules["customer.groups.id"]
    }
    */

    await mutateAsync(
      {
        starts_at: values.starts_at?.toISOString() || null,
        ends_at: values.ends_at?.toISOString() || null,
        rules: rules,
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
    <RouteDrawer.Form form={form}>
      <RouteDrawer.Description className="sr-only">
        {t("priceLists.configuration.edit.description")}
      </RouteDrawer.Description>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto">
          <Form.Field
            control={form.control}
            name="starts_at"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col">
                      <Form.Label optional>
                        {t("priceLists.fields.startsAt.label")}
                      </Form.Label>
                      <Form.Hint>
                        {t("priceLists.fields.startsAt.hint")}
                      </Form.Hint>
                    </div>
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
          <Divider />
          <Form.Field
            control={form.control}
            name="ends_at"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col">
                      <Form.Label optional>
                        {t("priceLists.fields.endsAt.label")}
                      </Form.Label>
                      <Form.Hint>
                        {t("priceLists.fields.endsAt.hint")}
                      </Form.Hint>
                    </div>
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
          {/* TODO: Customer group availability - vendor API does not support customer groups yet
          <Divider />
          <Form.Field
            control={form.control}
            name="customer_group_id"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div>
                    <Form.Label optional>
                      {t("priceLists.fields.customerAvailability.label")}
                    </Form.Label>
                    <Form.Hint>
                      {t("priceLists.fields.customerAvailability.hint")}
                    </Form.Hint>
                  </div>
                  <Form.Control>
                    <div
                      className={clx(
                        "bg-ui-bg-component shadow-elevation-card-rest transition-fg grid gap-1.5 rounded-xl py-1.5",
                        "aria-[invalid='true']:shadow-borders-error"
                      )}
                      role="application"
                      ref={field.ref}
                    >
                      <div className="text-ui-fg-subtle grid gap-1.5 px-1.5 md:grid-cols-2">
                        <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                          {t(
                            "priceLists.fields.customerAvailability.attribute"
                          )}
                        </div>
                        <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                          {t("operators.in")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-1.5">
                        <StackedDrawer id={STACKED_MODAL_ID}>
                          <StackedDrawer.Trigger asChild>
                            <button
                              type="button"
                              className="bg-ui-bg-field shadow-borders-base txt-compact-small text-ui-fg-muted flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5"
                            >
                              <MagnifyingGlass />
                              {t(
                                "priceLists.fields.customerAvailability.placeholder"
                              )}
                            </button>
                          </StackedDrawer.Trigger>
                          <StackedDrawer.Trigger asChild>
                            <Button variant="secondary">
                              {t("actions.browse")}
                            </Button>
                          </StackedDrawer.Trigger>
                          <StackedDrawer.Content>
                            <StackedDrawer.Header>
                              <StackedDrawer.Title asChild>
                                <Heading>
                                  {t(
                                    "priceLists.fields.customerAvailability.header"
                                  )}
                                </Heading>
                              </StackedDrawer.Title>
                              <StackedDrawer.Description className="sr-only">
                                {t(
                                  "priceLists.fields.customerAvailability.hint"
                                )}
                              </StackedDrawer.Description>
                            </StackedDrawer.Header>
                            <PriceListCustomerGroupRuleForm
                              type="drawer"
                              setState={handleAddCustomerGroup}
                              state={fields}
                            />
                          </StackedDrawer.Content>
                        </StackedDrawer>
                      </div>
                      {fields.length > 0 ? (
                        <div className="flex flex-col gap-y-1.5">
                          <Divider variant="dashed" />
                          <div className="flex flex-col gap-y-1.5 px-1.5">
                            {fields.map((field, index) => {
                              return (
                                <div
                                  key={field.cg_id}
                                  className="bg-ui-bg-field-component shadow-borders-base flex items-center justify-between gap-2 rounded-md px-2 py-0.5"
                                >
                                  <Text size="small" leading="compact">
                                    {field.name}
                                  </Text>
                                  <IconButton
                                    size="small"
                                    variant="transparent"
                                    type="button"
                                    onClick={() => remove(index)}
                                  >
                                    <XMark />
                                  </IconButton>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          */}
        </RouteDrawer.Body>
        <RouteDrawer.Footer className="shrink-0">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
