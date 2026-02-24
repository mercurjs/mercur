import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { InformationCircleSolid } from "@medusajs/icons"
import { Button, Heading, Input, Text, toast, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Form } from "../../../../../components/common/form"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { PercentageInput } from "../../../../../components/inputs/percentage-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateTaxRegion } from "../../../../../hooks/api"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { Combobox } from "../../../../../components/inputs/combobox"
import { formatProvider } from "../../../../../lib/format-provider"
import { sdk } from "../../../../../lib/client"
import { i18n } from "../../../../../components/utilities/i18n"

type TaxRegionCreateFormProps = {
  parentId?: string
}

const TaxRegionCreateSchema = z
  .object({
    name: z.string().optional(),
    code: z.string().optional(),
    rate: z.object({
      float: z.number().optional(),
      value: z.string().optional(),
    }),
    country_code: z.string(),
    provider_id: z.string(),
  })
  .superRefine(({ provider_id, country_code }, ctx) => {
    if (!provider_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("taxRegions.create.errors.missingProvider"),
        path: ["provider_id"],
      })
    }

    if (!country_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("taxRegions.create.errors.missingCountry"),
        path: ["country_code"],
      })
    }
  })

export const TaxRegionCreateForm = ({ parentId }: TaxRegionCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const taxProviders = useComboboxData({
    queryKey: ["tax_providers"],
    queryFn: (params) => sdk.admin.taxProvider.list(params),
    getOptions: (data) =>
      data.tax_providers.map((provider) => ({
        label: formatProvider(provider.id),
        value: provider.id,
      })),
  })

  const form = useForm<z.infer<typeof TaxRegionCreateSchema>>({
    defaultValues: {
      name: "",
      rate: {
        value: "",
      },
      code: "",
      country_code: "",
      provider_id: "",
    },
    resolver: zodResolver(TaxRegionCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateTaxRegion()

  const handleSubmit = form.handleSubmit(async (values) => {
    const defaultRate = values.name
      ? {
          name: values.name,
          rate:
            values.rate?.value === ""
              ? undefined
              : parseFloat(values.rate.value!),
              // TODO: Check if optional region's tax code is correct - was it intentionally set as optional? It's same for vendor panel.
              // Leaving it like this, previously it was sent as empty string too if not provided
          code: values.code ?? "",
        }
      : undefined

    await mutateAsync(
      {
        country_code: values.country_code,
        parent_id: parentId,
        default_tax_rate: defaultRate,
        provider_id: values.provider_id,
      },
      {
        onSuccess: ({ tax_region }) => {
          toast.success(t("taxRegions.create.successToast"))
          handleSuccess(`../${tax_region.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="tax-region-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="tax-region-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden" data-testid="tax-region-create-form-body">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div data-testid="tax-region-create-form-header-section">
                <Heading className="capitalize" data-testid="tax-region-create-form-heading">
                  {t("taxRegions.create.header")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="tax-region-create-form-hint">
                  {t("taxRegions.create.hint")}
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="country_code"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="tax-region-create-form-country-item">
                          <Form.Label data-testid="tax-region-create-form-country-label">{t("fields.country")}</Form.Label>
                          <Form.Control data-testid="tax-region-create-form-country-control">
                            <CountrySelect {...field} data-testid="tax-region-create-form-country-select" />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="tax-region-create-form-country-error" />
                        </Form.Item>
                      )
                    }}
                  />
                  <Form.Field
                    control={form.control}
                    name="provider_id"
                    render={({ field }) => (
                      <Form.Item data-testid="tax-region-create-form-provider-item">
                        <Form.Label data-testid="tax-region-create-form-provider-label">
                          {t("taxRegions.fields.taxProvider")}
                        </Form.Label>
                        <Form.Control data-testid="tax-region-create-form-provider-control">
                          <Combobox
                            {...field}
                            options={taxProviders.options}
                            searchValue={taxProviders.searchValue}
                            onSearchValueChange={
                              taxProviders.onSearchValueChange
                            }
                            fetchNextPage={taxProviders.fetchNextPage}
                            data-testid="tax-region-create-form-provider-combobox"
                          />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="tax-region-create-form-provider-error" />
                      </Form.Item>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4" data-testid="tax-region-create-form-default-tax-rate-section">
                <div className="flex items-center gap-x-1" data-testid="tax-region-create-form-default-tax-rate-header">
                  <Heading level="h2" className="!txt-compact-small-plus" data-testid="tax-region-create-form-default-tax-rate-label">
                    {t("taxRegions.fields.defaultTaxRate.label")}
                  </Heading>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-muted"
                    data-testid="tax-region-create-form-default-tax-rate-optional"
                  >
                    ({t("fields.optional")})
                  </Text>
                  <Tooltip
                    content={t("taxRegions.fields.defaultTaxRate.tooltip")}
                  >
                    <InformationCircleSolid className="text-ui-fg-muted" data-testid="tax-region-create-form-default-tax-rate-tooltip" />
                  </Tooltip>
                </div>
                <div className="flex flex-col gap-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Form.Field
                      control={form.control}
                      name="name"
                      render={({ field }) => {
                        return (
                          <Form.Item data-testid="tax-region-create-form-name-item">
                            <Form.Label data-testid="tax-region-create-form-name-label">{t("fields.name")}</Form.Label>
                            <Form.Control data-testid="tax-region-create-form-name-control">
                              <Input {...field} data-testid="tax-region-create-form-name-input" />
                            </Form.Control>
                            <Form.ErrorMessage data-testid="tax-region-create-form-name-error" />
                          </Form.Item>
                        )
                      }}
                    />
                    <Form.Field
                      control={form.control}
                      name="rate"
                      render={({ field: { value, onChange, ...field } }) => {
                        return (
                          <Form.Item data-testid="tax-region-create-form-rate-item">
                            <Form.Label data-testid="tax-region-create-form-rate-label">
                              {t("taxRegions.fields.taxRate")}
                            </Form.Label>
                            <Form.Control data-testid="tax-region-create-form-rate-control">
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
                                data-testid="tax-region-create-form-rate-input"
                              />
                            </Form.Control>
                            <Form.ErrorMessage data-testid="tax-region-create-form-rate-error" />
                          </Form.Item>
                        )
                      }}
                    />
                    <Form.Field
                      control={form.control}
                      name="code"
                      render={({ field }) => {
                        return (
                          <Form.Item data-testid="tax-region-create-form-code-item">
                            <Form.Label data-testid="tax-region-create-form-code-label">
                              {t("taxRegions.fields.taxCode")}
                            </Form.Label>
                            <Form.Control data-testid="tax-region-create-form-code-control">
                              <Input {...field} data-testid="tax-region-create-form-code-input" />
                            </Form.Control>
                            <Form.ErrorMessage data-testid="tax-region-create-form-code-error" />
                          </Form.Item>
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="tax-region-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="tax-region-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="tax-region-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
