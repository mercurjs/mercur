import { zodResolver } from "@hookform/resolvers/zod"
import { XMarkMini } from "@medusajs/icons"
import {
  Button,
  Checkbox,
  Heading,
  Input,
  Select,
  Switch,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "../../../../../components/modals"
import { _DataTable } from "../../../../../components/table/data-table"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateRegion } from "../../../../../hooks/api/regions"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { countries as staticCountries, StaticCountry } from "../../../../../lib/data/countries"
import { CurrencyInfo } from "../../../../../lib/data/currencies"
import { formatProvider } from "../../../../../lib/format-provider"
import { useCountries } from "../../../common/hooks/use-countries"
import { useCountryTableColumns } from "../../../common/hooks/use-country-table-columns"
import { useCountryTableQuery } from "../../../common/hooks/use-country-table-query"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { sdk } from "../../../../../lib/client"

type CreateRegionFormProps = {
  currencies: CurrencyInfo[]
}

const CreateRegionSchema = zod.object({
  name: zod.string().min(1),
  currency_code: zod.string().min(2, "Select a currency"),
  automatic_taxes: zod.boolean(),
  is_tax_inclusive: zod.boolean(),
  countries: zod.array(zod.object({ code: zod.string(), name: zod.string() })),
  payment_providers: zod.array(zod.string()).min(1),
})

const PREFIX = "cr"
const PAGE_SIZE = 50

const STACKED_MODAL_ID = "countries-modal"

export const CreateRegionForm = ({ currencies }: CreateRegionFormProps) => {
  const { setIsOpen } = useStackedModal()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()
  const form = useForm<zod.infer<typeof CreateRegionSchema>>({
    defaultValues: {
      name: "",
      currency_code: "",
      automatic_taxes: true,
      is_tax_inclusive: false,
      countries: [],
      payment_providers: [],
    },
    resolver: zodResolver(CreateRegionSchema),
  })

  const selectedCountries = useWatch({
    control: form.control,
    name: "countries",
    defaultValue: [],
  })

  const { t } = useTranslation()

  const { mutateAsync: createRegion, isPending: isPendingRegion } =
    useCreateRegion()

  const handleSubmit = form.handleSubmit(async (values) => {
    await createRegion(
      {
        name: values.name,
        countries: values.countries.map((c) => c.code),
        currency_code: values.currency_code,
        payment_providers: values.payment_providers,
        automatic_taxes: values.automatic_taxes,
        is_tax_inclusive: values.is_tax_inclusive,
      },
      {
        onSuccess: ({ region }) => {
          toast.success(t("regions.toast.create"))
          handleSuccess(`../${region.id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  const { searchParams, raw } = useCountryTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  const { countries, count } = useCountries({
    countries: staticCountries.map((c, i) => ({
      display_name: c.display_name,
      name: c.name,
      id: i,
      iso_2: c.iso_2,
      iso_3: c.iso_3,
      num_code: c.num_code,
      region_id: null,
      region: {},
    })),
    ...searchParams,
  })

  const columns = useColumns()

  const { table } = useDataTable({
    data: countries || [],
    columns,
    count,
    enablePagination: true,
    enableRowSelection: true,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    getRowId: (row) => row.iso_2,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const saveCountries = () => {
    const selected = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    )

    form.setValue(
      "countries",
      selected.map((key) => ({
        code: key,
        name: staticCountries.find((c) => c.iso_2 === key)!.display_name,
      })),
      { shouldDirty: true, shouldTouch: true }
    )

    setIsOpen(STACKED_MODAL_ID, false)
  }

  const removeCountry = (code: string) => {
    const update = selectedCountries.filter((c) => c.code !== code)
    const ids = update
      .map((c) => c.code)
      .reduce((acc, c) => {
        acc[c] = true
        
        return acc
      }, {} as RowSelectionState)

    form.setValue("countries", update, { shouldDirty: true, shouldTouch: true })
    setRowSelection(ids)
  }

  const clearCountries = () => {
    form.setValue("countries", [], { shouldDirty: true, shouldTouch: true })
    setRowSelection({})
  }

  const comboboxProviders = useComboboxData({
    queryFn: (params) =>
      sdk.admin.payment.listPaymentProviders({ ...params, is_enabled: true }),
    queryKey: ["payment_providers"],
    getOptions: (data) =>
      data.payment_providers.map((pp) => ({
        label: formatProvider(pp.id),
        value: pp.id,
      })),
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="region-create-form">
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header data-testid="region-create-form-header" />
        <RouteFocusModal.Body className="flex overflow-hidden" data-testid="region-create-form-body">
          <div
            className={clx(
              "flex h-full w-full flex-col items-center overflow-y-auto p-16"
            )}
            id="form-section"
          >
            <div className="flex w-full max-w-[720px] flex-col gap-y-8">
              <div data-testid="region-create-form-header-section">
                <Heading data-testid="region-create-form-heading">{t("regions.createRegion")}</Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="region-create-form-hint">
                  {t("regions.createRegionHint")}
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="region-create-form-name-item">
                          <Form.Label data-testid="region-create-form-name-label">{t("fields.name")}</Form.Label>
                          <Form.Control data-testid="region-create-form-name-control">
                            <Input {...field} data-testid="region-create-form-name-input" />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="region-create-form-name-error" />
                        </Form.Item>
                      )
                    }}
                  />
                  <Form.Field
                    control={form.control}
                    name="currency_code"
                    render={({ field: { onChange, ref, ...field } }) => {
                      return (
                        <Form.Item data-testid="region-create-form-currency-item">
                          <Form.Label data-testid="region-create-form-currency-label">{t("fields.currency")}</Form.Label>
                          <Form.Control data-testid="region-create-form-currency-control">
                            <Select
                              dir={direction}
                              {...field}
                              onValueChange={onChange}
                              data-testid="region-create-form-currency-select"
                            >
                              <Select.Trigger ref={ref} data-testid="region-create-form-currency-select-trigger">
                                <Select.Value />
                              </Select.Trigger>
                              <Select.Content data-testid="region-create-form-currency-select-content">
                                {currencies.map((currency) => (
                                  <Select.Item
                                    value={currency.code}
                                    key={currency.code}
                                    data-testid={`region-create-form-currency-select-option-${currency.code}`}
                                  >
                                    {currency.name}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          </Form.Control>
                          <Form.ErrorMessage data-testid="region-create-form-currency-error" />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
              <Form.Field
                control={form.control}
                name="automatic_taxes"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item data-testid="region-create-form-automatic-taxes-item">
                      <div>
                        <div className="flex items-start justify-between">
                          <Form.Label data-testid="region-create-form-automatic-taxes-label">{t("fields.automaticTaxes")}</Form.Label>
                          <Form.Control data-testid="region-create-form-automatic-taxes-control">
                            <Switch
                              dir="ltr"
                              className="rtl:rotate-180"
                              {...field}
                              checked={value}
                              onCheckedChange={onChange}
                              data-testid="region-create-form-automatic-taxes-switch"
                            />
                          </Form.Control>
                        </div>
                        <Form.Hint data-testid="region-create-form-automatic-taxes-hint">{t("regions.automaticTaxesHint")}</Form.Hint>
                        <Form.ErrorMessage data-testid="region-create-form-automatic-taxes-error" />
                      </div>
                    </Form.Item>
                  )
                }}
              />

              <Form.Field
                control={form.control}
                name="is_tax_inclusive"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item data-testid="region-create-form-tax-inclusive-item">
                      <div>
                        <div className="flex items-start justify-between">
                          <Form.Label data-testid="region-create-form-tax-inclusive-label">
                            {t("fields.taxInclusivePricing")}
                          </Form.Label>
                          <Form.Control data-testid="region-create-form-tax-inclusive-control">
                            <Switch
                              className="rtl:rotate-180"
                              dir="ltr"
                              {...field}
                              checked={value}
                              onCheckedChange={onChange}
                              data-testid="region-create-form-tax-inclusive-switch"
                            />
                          </Form.Control>
                        </div>
                        <Form.Hint data-testid="region-create-form-tax-inclusive-hint">{t("regions.taxInclusiveHint")}</Form.Hint>
                        <Form.ErrorMessage data-testid="region-create-form-tax-inclusive-error" />
                      </div>
                    </Form.Item>
                  )
                }}
              />

              <div className="bg-ui-border-base h-px w-full" />
              <div className="flex flex-col gap-y-4" data-testid="region-create-form-countries-section">
                <div data-testid="region-create-form-countries-header">
                  <Text size="small" leading="compact" weight="plus" data-testid="region-create-form-countries-label">
                    {t("fields.countries")}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle" data-testid="region-create-form-countries-hint">
                    {t("regions.countriesHint")}
                  </Text>
                </div>
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="region-create-form-countries-selected">
                    {selectedCountries.map((country) => (
                      <CountryTag
                        key={country.code}
                        country={country}
                        onRemove={removeCountry}
                      />
                    ))}
                    <Button
                      variant="transparent"
                      size="small"
                      className="text-ui-fg-muted hover:text-ui-fg-subtle"
                      onClick={clearCountries}
                      data-testid="region-create-form-countries-clear-all-button"
                    >
                      {t("actions.clearAll")}
                    </Button>
                  </div>
                )}
                <StackedFocusModal id={STACKED_MODAL_ID} data-testid="region-create-form-countries-modal">
                  <div className="flex items-center justify-end">
                    <StackedFocusModal.Trigger asChild>
                      <Button variant="secondary" size="small" data-testid="region-create-form-countries-add-button">
                        {t("regions.addCountries")}
                      </Button>
                    </StackedFocusModal.Trigger>
                  </div>
                  <StackedFocusModal.Content data-testid="region-create-form-countries-modal-content">
                    <div className="flex size-full flex-col overflow-hidden">
                      <StackedFocusModal.Header data-testid="region-create-form-countries-modal-header">
                        <StackedFocusModal.Title asChild>
                          <span className="sr-only">
                            {t("regions.addCountries")}
                          </span>
                        </StackedFocusModal.Title>
                      </StackedFocusModal.Header>
                      <StackedFocusModal.Body className="overflow-hidden" data-testid="region-create-form-countries-modal-body">
                        <_DataTable
                          table={table}
                          columns={columns}
                          count={count}
                          pageSize={PAGE_SIZE}
                          orderBy={[
                            { key: "display_name", label: t("fields.name") },
                            { key: "iso_2", label: t("fields.code") },
                          ]}
                          pagination
                          search="autofocus"
                          layout="fill"
                          queryObject={raw}
                          prefix={PREFIX}
                          data-testid="region-create-form-countries-modal-table"
                        />
                      </StackedFocusModal.Body>
                      <StackedFocusModal.Footer data-testid="region-create-form-countries-modal-footer">
                        <div className="flex items-center justify-end gap-x-2">
                          <StackedFocusModal.Close asChild>
                            <Button variant="secondary" size="small" data-testid="region-create-form-countries-modal-cancel-button">
                              {t("actions.cancel")}
                            </Button>
                          </StackedFocusModal.Close>
                          <Button
                            size="small"
                            type="button"
                            onClick={saveCountries}
                            data-testid="region-create-form-countries-modal-save-button"
                          >
                            {t("actions.save")}
                          </Button>
                        </div>
                      </StackedFocusModal.Footer>
                    </div>
                  </StackedFocusModal.Content>
                </StackedFocusModal>
              </div>
              <div className="bg-ui-border-base h-px w-full" />
              <div className="flex flex-col gap-y-4" data-testid="region-create-form-payment-providers-section">
                <div data-testid="region-create-form-payment-providers-header">
                  <Text size="small" leading="compact" weight="plus" data-testid="region-create-form-payment-providers-label">
                    {t("fields.providers")}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle" data-testid="region-create-form-payment-providers-hint">
                    {t("regions.providersHint")}
                  </Text>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="payment_providers"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="region-create-form-payment-providers-item">
                          <Form.Label data-testid="region-create-form-payment-providers-item-label">
                            {t("fields.paymentProviders")}
                          </Form.Label>
                          <Form.Control data-testid="region-create-form-payment-providers-item-control">
                            <Combobox
                              forceHideInput
                              options={comboboxProviders.options}
                              fetchNextPage={comboboxProviders.fetchNextPage}
                              {...field}
                              data-testid="region-create-form-payment-providers-combobox"
                            />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="region-create-form-payment-providers-item-error" />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="region-create-form-footer">
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary" data-testid="region-create-form-cancel-button">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button size="small" type="submit" isLoading={isPendingRegion} data-testid="region-create-form-save-button">
            {t("actions.save")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const columnHelper = createColumnHelper<StaticCountry>()

const useColumns = () => {
  const base = useCountryTableColumns()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              data-testid="region-create-form-countries-modal-select-all-checkbox"
            />
          )
        },
        cell: ({ row }) => {
          const isPreselected = !row.getCanSelect()

          return (
            <Checkbox
              checked={row.getIsSelected() || isPreselected}
              disabled={isPreselected}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
              data-testid={`region-create-form-countries-modal-select-checkbox-${row.original.iso_2}`}
            />
          )
        },
      }),
      ...base,
    ],
    [base]
  )
}

const CountryTag = ({
  country,
  onRemove,
}: {
  country: { code: string; name: string }
  onRemove: (code: string) => void
}) => {
  return (
    <div className="bg-ui-bg-field shadow-borders-base transition-fg hover:bg-ui-bg-field-hover flex h-7 items-center overflow-hidden rounded-md" data-testid={`region-create-form-country-tag-${country.code}`}>
      <div className="txt-compact-small-plus flex h-full select-none items-center justify-center px-2 py-0.5" data-testid={`region-create-form-country-tag-${country.code}-name`}>
        {country.name}
      </div>
      <button
        type="button"
        onClick={() => onRemove(country.code)}
        className="focus-visible:bg-ui-bg-field-hover transition-fg hover:bg-ui-bg-field-hover flex h-full w-7 items-center justify-center border-l outline-none"
        data-testid={`region-create-form-country-tag-${country.code}-remove-button`}
      >
        <XMarkMini className="text-ui-fg-muted" />
      </button>
    </div>
  )
}
