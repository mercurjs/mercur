import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, RadioGroup, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "@components/common/form"
import { Combobox } from "@components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateShippingOptions } from "@hooks/api/shipping-options"
import { useComboboxData } from "@hooks/use-combobox-data"
import { fetchQuery } from "@lib/client"
import {
  getShippingProfileName,
  isOptionEnabledInStore,
} from "@lib/shipping-options"
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from "@pages/settings/locations/_common/constants"

type EditShippingOptionFormProps = {
  locationId: string
  shippingOption: HttpTypes.AdminShippingOption
  type: FulfillmentSetType
}

const EditShippingOptionSchema = zod.object({
  name: zod.string().min(1),
  price_type: zod.nativeEnum(ShippingOptionPriceType),
  enabled_in_store: zod.boolean().optional(),
  shipping_profile_id: zod.string(),
})

export const EditShippingOptionForm = ({
  locationId,
  shippingOption,
  type,
}: EditShippingOptionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const isPickup = type === FulfillmentSetType.Pickup

  const shippingProfiles = useComboboxData({
    queryFn: async () => {
      const { shipping_profiles } = await fetchQuery(
        "/vendor/shipping-profiles",
        {
          method: "GET",
        }
      )
      return shipping_profiles
    },
    queryKey: ["shipping_profiles_edit_shipping_option"],
    getOptions: (data) =>
      data?.map((profile: any) => ({
        label: getShippingProfileName(profile.shipping_profile.name),
        value: profile.shipping_profile.id,
      })),
    defaultValue: shippingOption.shipping_profile_id,
  })

  const form = useForm<zod.infer<typeof EditShippingOptionSchema>>({
    defaultValues: {
      name: shippingOption.name,
      price_type: shippingOption.price_type as ShippingOptionPriceType,
      enabled_in_store: isOptionEnabledInStore(shippingOption),
      shipping_profile_id: shippingOption.shipping_profile_id,
    },
    resolver: zodResolver(EditShippingOptionSchema),
  })

  const { mutateAsync, isPending: isLoading } = useUpdateShippingOptions(
    shippingOption.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        shipping_profile_id: values.shipping_profile_id,
        provider_id: shippingOption.provider_id,
      },
      {
        onSuccess: ({ shipping_option }) => {
          toast.success(
            t("stockLocations.shippingOptions.edit.successToast", {
              name: shipping_option.name,
            })
          )
          handleSuccess(`/settings/locations/${locationId}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-8">
              {!isPickup && (
                <Form.Field
                  control={form.control}
                  name="price_type"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>
                          {t(
                            "stockLocations.shippingOptions.fields.priceType.label"
                          )}
                        </Form.Label>
                        <Form.Control>
                          <RadioGroup {...field} onValueChange={field.onChange}>
                            <RadioGroup.ChoiceBox
                              className="flex-1"
                              value={ShippingOptionPriceType.FlatRate}
                              label={t(
                                "stockLocations.shippingOptions.fields.priceType.options.fixed.label"
                              )}
                              description={t(
                                "stockLocations.shippingOptions.fields.priceType.options.fixed.hint"
                              )}
                            />
                            <RadioGroup.ChoiceBox
                              className="flex-1"
                              value={ShippingOptionPriceType.Calculated}
                              label={t(
                                "stockLocations.shippingOptions.fields.priceType.options.calculated.label"
                              )}
                              description={t(
                                "stockLocations.shippingOptions.fields.priceType.options.calculated.hint"
                              )}
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              )}

              <div className="grid gap-y-4">
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t("fields.name")}</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="shipping_profile_id"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>
                          {t("stockLocations.shippingOptions.fields.profile")}
                        </Form.Label>
                        <Form.Control>
                          <Combobox
                            {...field}
                            options={shippingProfiles.options}
                            searchValue={shippingProfiles.searchValue}
                            onSearchValueChange={
                              shippingProfiles.onSearchValueChange
                            }
                            disabled={shippingProfiles.disabled}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              </div>

              {/* <Divider />
              <SwitchBox
                control={form.control}
                name="enabled_in_store"
                label={t(
                  "stockLocations.shippingOptions.fields.enableInStore.label"
                )}
                description={t(
                  "stockLocations.shippingOptions.fields.enableInStore.hint"
                )}
              /> */}
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isLoading}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
