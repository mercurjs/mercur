import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProduct } from "../../../../../hooks/api/products"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { sdk } from "../../../../../lib/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"

type ProductShippingProfileFormProps = {
  product: HttpTypes.AdminProduct & {
    shipping_profile?: HttpTypes.AdminShippingProfile
  }
}

const ProductShippingProfileSchema = zod.object({
  shipping_profile_id: zod.string(),
})

export const ProductShippingProfileForm = ({
  product,
}: ProductShippingProfileFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const shippingProfiles = useComboboxData({
    queryKey: ["shipping_profiles"],
    queryFn: (params) => sdk.admin.shippingProfile.list(params),
    getOptions: (data) =>
      data.shipping_profiles.map((shippingProfile) => ({
        label: shippingProfile.name,
        value: shippingProfile.id,
      })),
  })

  const form = useForm({
    defaultValues: {
      shipping_profile_id: product.shipping_profile?.id ?? "",
    },
    resolver: zodResolver(ProductShippingProfileSchema),
  })

  const selectedShippingProfile = form.watch("shipping_profile_id")

  const { mutateAsync, isPending } = useUpdateProduct(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        shipping_profile_id:
          data.shipping_profile_id === "" ? null : data.shipping_profile_id,
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t("products.shippingProfile.edit.toasts.success", {
              title: product.title,
            })
          )
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  useEffect(() => {
    if (typeof selectedShippingProfile === "undefined") {
      form.setValue("shipping_profile_id", "")
    }
  }, [selectedShippingProfile])

  return (
    <RouteDrawer.Form form={form} data-testid="product-shipping-profile-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col" data-testid="product-shipping-profile-keybound-form">
        <RouteDrawer.Body data-testid="product-shipping-profile-form-body">
          <div className="flex h-full flex-col gap-y-4" data-testid="product-shipping-profile-form-fields">
            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-shipping-profile-form-shipping-profile-item">
                    <Form.Label data-testid="product-shipping-profile-form-shipping-profile-label">
                      {t("products.fields.shipping_profile.label")}
                    </Form.Label>
                    <Form.Control data-testid="product-shipping-profile-form-shipping-profile-control">
                      <Combobox
                        {...field}
                        allowClear
                        options={shippingProfiles.options}
                        searchValue={shippingProfiles.searchValue}
                        onSearchValueChange={
                          shippingProfiles.onSearchValueChange
                        }
                        fetchNextPage={shippingProfiles.fetchNextPage}
                        data-testid="product-shipping-profile-form-shipping-profile-combobox"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-shipping-profile-form-shipping-profile-error" />
                  </Form.Item>
                )
              }}
            />

            {/* <FormExtensionZone fields={fields} form={form} /> */}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-shipping-profile-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="product-shipping-profile-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="product-shipping-profile-form-cancel-button-wrapper">
              <Button size="small" variant="secondary" data-testid="product-shipping-profile-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="product-shipping-profile-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
