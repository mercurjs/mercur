import { zodResolver } from "@hookform/resolvers/zod"
import { InformationCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Input, Text, toast, Tooltip } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { PercentageInput } from "../../../../../components/inputs/percentage-input"
import { ProvinceSelect } from "../../../../../components/inputs/province-select"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateTaxRegion } from "../../../../../hooks/api/tax-regions"
import { getCountryProvinceObjectByIso2 } from "../../../../../lib/data/country-states"

type TaxRegionProvinceCreateFormProps = {
  parent: HttpTypes.AdminTaxRegion
}

const CreateTaxRegionProvinceSchema = z.object({
  province_code: z.string().min(1),
  name: z.string().optional(),
  code: z.string().min(1),
  rate: z
    .object({
      float: z.number().optional(),
      value: z.string().optional(),
    })
    .optional(),
  is_combinable: z.boolean().optional(),
})

export const TaxRegionProvinceCreateForm = ({
  parent,
}: TaxRegionProvinceCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateTaxRegionProvinceSchema>>({
    defaultValues: {
      province_code: "",
      code: "",
      is_combinable: false,
      name: "",
      rate: {
        value: "",
      },
    },
    resolver: zodResolver(CreateTaxRegionProvinceSchema),
  })

  const { mutateAsync, isPending } = useCreateTaxRegion()

  const handleSubmit = form.handleSubmit(async (values) => {
    const defaultRate =
      values.name && values.rate?.float
        ? {
            name: values.name,
            rate: values.rate.float,
            code: values.code,
            is_combinable: values.is_combinable,
          }
        : undefined

    await mutateAsync(
      {
        country_code: parent.country_code!,
        province_code: values.province_code,
        parent_id: parent.id,
        default_tax_rate: defaultRate,
      },
      {
        onSuccess: ({ tax_region }) => {
          toast.success(t("taxRegions.create.successToast"))
          handleSuccess(
            `/settings/tax-regions/${parent.id}/provinces/${tax_region.id}`
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const countryProvinceObject = getCountryProvinceObjectByIso2(
    parent.country_code!
  )

  const type = countryProvinceObject?.type || "sublevel"
  const label = t(`taxRegions.fields.sublevels.labels.${type}`)

  return (
    <RouteFocusModal.Form form={form} data-testid="tax-region-province-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="tax-region-province-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden" data-testid="tax-region-province-create-form-body">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div data-testid="tax-region-province-create-form-header-section">
                <Heading data-testid="tax-region-province-create-form-heading">{t(`taxRegions.${type}.create.header`)}</Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="tax-region-province-create-form-hint">
                  {t(`taxRegions.${type}.create.hint`)}
                </Text>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="province_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="tax-region-province-create-form-province-item">
                        <Form.Label
                          tooltip={
                            !countryProvinceObject &&
                            t("taxRegions.fields.sublevels.tooltips.sublevel")
                          }
                          data-testid="tax-region-province-create-form-province-label"
                        >
                          {label}
                        </Form.Label>
                        <Form.Control data-testid="tax-region-province-create-form-province-control">
                          {countryProvinceObject ? (
                            <ProvinceSelect
                              country_code={parent.country_code!}
                              {...field}
                              data-testid="tax-region-province-create-form-province-select"
                            />
                          ) : (
                            <Input {...field} placeholder="KR-26" data-testid="tax-region-province-create-form-province-input" />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage data-testid="tax-region-province-create-form-province-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <div className="flex flex-col gap-4" data-testid="tax-region-province-create-form-default-tax-rate-section">
                <div className="flex items-center gap-x-1" data-testid="tax-region-province-create-form-default-tax-rate-header">
                  <Heading level="h2" className="!txt-compact-small-plus" data-testid="tax-region-province-create-form-default-tax-rate-label">
                    {t("taxRegions.fields.defaultTaxRate.label")}
                  </Heading>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-muted"
                    data-testid="tax-region-province-create-form-default-tax-rate-optional"
                  >
                    ({t("fields.optional")})
                  </Text>
                  <Tooltip
                    content={t("taxRegions.fields.defaultTaxRate.tooltip")}
                  >
                    <InformationCircleSolid className="text-ui-fg-muted" data-testid="tax-region-province-create-form-default-tax-rate-tooltip" />
                  </Tooltip>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="tax-region-province-create-form-name-item">
                          <Form.Label data-testid="tax-region-province-create-form-name-label">{t("fields.name")}</Form.Label>
                          <Form.Control data-testid="tax-region-province-create-form-name-control">
                            <Input {...field} data-testid="tax-region-province-create-form-name-input" />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="tax-region-province-create-form-name-error" />
                        </Form.Item>
                      )
                    }}
                  />
                  <Form.Field
                    control={form.control}
                    name="rate"
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Form.Item data-testid="tax-region-province-create-form-rate-item">
                          <Form.Label data-testid="tax-region-province-create-form-rate-label">
                            {t("taxRegions.fields.taxRate")}
                          </Form.Label>
                          <Form.Control data-testid="tax-region-province-create-form-rate-control">
                            <PercentageInput
                              {...field}
                              value={value?.value}
                              decimalsLimit={4}
                              onValueChange={(value, _name, values) =>
                                onChange({
                                  value: value,
                                  float: values?.float,
                                })
                              }
                              data-testid="tax-region-province-create-form-rate-input"
                            />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="tax-region-province-create-form-rate-error" />
                        </Form.Item>
                      )
                    }}
                  />
                  <Form.Field
                    control={form.control}
                    name="code"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="tax-region-province-create-form-code-item">
                          <Form.Label data-testid="tax-region-province-create-form-code-label">
                            {t("taxRegions.fields.taxCode")}
                          </Form.Label>
                          <Form.Control data-testid="tax-region-province-create-form-code-control">
                            <Input {...field} data-testid="tax-region-province-create-form-code-input" />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="tax-region-province-create-form-code-error" />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
              <SwitchBox
                control={form.control}
                name="is_combinable"
                label={t("taxRegions.fields.isCombinable.label")}
                description={t("taxRegions.fields.isCombinable.hint")}
                data-testid="tax-region-province-create-form-is-combinable"
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="tax-region-province-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="tax-region-province-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="tax-region-province-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
