import { zodResolver } from "@hookform/resolvers/zod"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Heading,
  IconButton,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { StackedDrawer } from "../../../../../components/modals/stacked-drawer"
import { useStackedModal } from "../../../../../components/modals/stacked-modal-provider"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdatePriceList } from "../../../../../hooks/api/price-lists"
import { PriceListCustomerGroupRuleForm } from "../../../common/components/price-list-customer-group-rule-form"
import { PricingCustomerGroupsArrayType } from "../../../price-list-create/components/price-list-create-form/schema"

type PriceListCustomerAvailabilityFormProps = {
  priceList: HttpTypes.AdminPriceList
  customerGroups: { id: string; name: string }[]
}

const PriceListCustomerAvailabilitySchema = z.object({
  customer_group_id: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
})

const STACKED_MODAL_ID = "cg"

export const PriceListCustomerAvailabilityForm = ({
  priceList,
  customerGroups,
}: PriceListCustomerAvailabilityFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { setIsOpen } = useStackedModal()

  const form = useForm<z.infer<typeof PriceListCustomerAvailabilitySchema>>({
    defaultValues: {
      customer_group_id: customerGroups,
    },
    resolver: zodResolver(PriceListCustomerAvailabilitySchema),
  })

  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: "customer_group_id",
    keyName: "cg_id",
  })

  const handleAddCustomerGroup = (groups: PricingCustomerGroupsArrayType) => {
    if (!groups.length) {
      form.setValue("customer_group_id", [])
      setIsOpen(STACKED_MODAL_ID, false)
      return
    }

    const newIds = groups.map((group) => group.id)

    const fieldsToAdd = groups.filter(
      (group) => !fields.some((field) => field.id === group.id)
    )

    for (const field of fields) {
      if (!newIds.includes(field.id)) {
        remove(fields.indexOf(field))
      }
    }

    append(fieldsToAdd)
    setIsOpen(STACKED_MODAL_ID, false)
  }

  const { mutateAsync } = useUpdatePriceList(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const groupIds = values.customer_group_id.map((group) => group.id)
    const rules = { ...priceList.rules }

    if (groupIds.length) {
      rules["customer.groups.id"] = groupIds
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
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto" data-testid="price-list-customer-availability-form-body">
          <Form.Field
            control={form.control}
            name="customer_group_id"
            render={({ field }) => {
              return (
                <Form.Item>
                  <div>
                    <Form.Label>
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
                          {t("priceLists.fields.customerAvailability.attribute")}
                        </div>
                        <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                          {t("operators.in")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-1.5" data-testid="price-list-customer-availability-dropdown">
                        <StackedDrawer id={STACKED_MODAL_ID}>
                          <StackedDrawer.Trigger asChild>
                            <button
                              type="button"
                              className="bg-ui-bg-field shadow-borders-base txt-compact-small text-ui-fg-muted flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5"
                              data-testid="price-list-customer-availability-search-button"
                            >
                              <MagnifyingGlass />
                              {t("priceLists.fields.customerAvailability.placeholder")}
                            </button>
                          </StackedDrawer.Trigger>
                          <StackedDrawer.Trigger asChild>
                            <Button variant="secondary" data-testid="price-list-customer-availability-browse-button">
                              {t("actions.browse")}
                            </Button>
                          </StackedDrawer.Trigger>
                          <StackedDrawer.Content>
                            <StackedDrawer.Header>
                              <StackedDrawer.Title asChild>
                                <Heading>
                                  {t("priceLists.fields.customerAvailability.header")}
                                </Heading>
                              </StackedDrawer.Title>
                              <StackedDrawer.Description className="sr-only">
                                {t("priceLists.fields.customerAvailability.hint")}
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
                        <div className="flex flex-col gap-y-1.5" data-testid="price-list-customer-availability-list">
                          <div className="flex flex-col gap-y-1.5 px-1.5">
                            {fields.map((cgField, index) => {
                              return (
                                <div
                                  key={cgField.cg_id}
                                  className="bg-ui-bg-field-component shadow-borders-base flex items-center justify-between gap-2 rounded-md px-2 py-0.5"
                                  data-testid={`price-list-customer-availability-item-${index}`}
                                >
                                  <Text size="small" leading="compact" data-testid={`price-list-customer-availability-item-${index}-name`}>
                                    {cgField.name}
                                  </Text>
                                  <IconButton
                                    size="small"
                                    variant="transparent"
                                    type="button"
                                    onClick={() => remove(index)}
                                    data-testid={`price-list-customer-availability-item-${index}-remove-button`}
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
