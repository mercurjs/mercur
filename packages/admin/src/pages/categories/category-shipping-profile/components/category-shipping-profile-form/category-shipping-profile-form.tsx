import { zodResolver } from "@hookform/resolvers/zod"
import { Button, toast } from "@medusajs/ui"
import { usePermissionGate } from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { ConditionalTooltip } from "../../../../../components/common/conditional-tooltip"
import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductCategoryShippingProfile } from "../../../../../hooks/api/categories"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { sdk } from "../../../../../lib/client"
import { CategoryWithShippingProfile } from "../../../category-detail/components/category-shipping-section"

const CategoryShippingProfileSchema = z.object({
  shipping_profile_id: z.string().optional(),
})

type CategoryShippingProfileFormProps = {
  category: CategoryWithShippingProfile
}

export const CategoryShippingProfileForm = ({
  category,
}: CategoryShippingProfileFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const shippingProfilesGate = usePermissionGate("shipping_profiles:view")

  const shippingProfiles = useComboboxData({
    queryKey: ["shipping_profiles"],
    queryFn: (params) => sdk.admin.shippingProfiles.query(params),
    getOptions: (data) =>
      data.shipping_profiles.map((shippingProfile) => ({
        label: shippingProfile.name,
        value: shippingProfile.id,
      })),
    defaultValue: category.default_shipping_profile?.id,
    enabled: shippingProfilesGate.allowed,
  })

  const form = useForm<z.infer<typeof CategoryShippingProfileSchema>>({
    defaultValues: {
      shipping_profile_id: category.default_shipping_profile?.id ?? "",
    },
    resolver: zodResolver(CategoryShippingProfileSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductCategoryShippingProfile(
    category.id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        shipping_profile_id: data.shipping_profile_id
          ? data.shipping_profile_id
          : null,
      },
      {
        onSuccess: () => {
          toast.success(t("categories.shippingProfile.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col"
        data-testid="category-shipping-profile-form"
      >
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("categories.shippingProfile.label")}
                    </Form.Label>
                    <ConditionalTooltip
                      showTooltip={shippingProfilesGate.denied}
                      content={shippingProfilesGate.tooltip}
                    >
                      <div>
                        <Form.Control>
                          <Combobox
                            {...field}
                            value={field.value ?? ""}
                            allowClear
                            disabled={shippingProfilesGate.denied}
                            options={shippingProfiles.options}
                            searchValue={shippingProfiles.searchValue}
                            onSearchValueChange={
                              shippingProfiles.onSearchValueChange
                            }
                            fetchNextPage={shippingProfiles.fetchNextPage}
                            data-testid="category-shipping-profile-form-combobox"
                          />
                        </Form.Control>
                      </div>
                    </ConditionalTooltip>
                    <Form.Hint>{t("categories.shippingProfile.hint")}</Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="category-shipping-profile-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="category-shipping-profile-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
