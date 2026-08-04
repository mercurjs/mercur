import { MagnifyingGlass, XMarkMini } from "@medusajs/icons"
import { Button, Divider, IconButton, Text, clx } from "@medusajs/ui"
import { Control, FieldValues, Path, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { StackedFocusModal, useStackedModal } from "@components/modals"
import { PriceListCustomerGroupRuleForm } from "../price-list-customer-group-rule-form"

type CustomerGroup = { id: string; name: string }

type PriceListCustomerAvailabilitySelectorProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  stackedId?: string
}

/**
 * Reusable "Customer availability" builder (attribute · in · Browse · chips)
 * shared by the create wizard and the detail edit drawer. The bound field is
 * an array of `{ id, name }` customer groups.
 */
export const PriceListCustomerAvailabilitySelector = <T extends FieldValues>({
  control,
  name,
  stackedId = "cg",
}: PriceListCustomerAvailabilitySelectorProps<T>) => {
  const { t } = useTranslation()
  const { setIsOpen } = useStackedModal()

  const { fields, append, remove } = useFieldArray({
    control,
    name: name as never,
    keyName: "cg_id",
  })

  const selected = fields as unknown as (CustomerGroup & { cg_id: string })[]

  const handleAdd = (groups: CustomerGroup[]) => {
    const newIds = groups.map((group) => group.id)

    const fieldsToAdd = groups.filter(
      (group) => !selected.some((field) => field.id === group.id)
    )

    for (const field of selected) {
      if (!newIds.includes(field.id)) {
        remove(selected.indexOf(field))
      }
    }

    append(fieldsToAdd as never)
    setIsOpen(stackedId, false)
  }

  return (
    <div
      className={clx(
        "bg-ui-bg-component shadow-elevation-card-rest transition-fg grid gap-1.5 rounded-xl py-1.5",
        "aria-[invalid='true']:shadow-borders-error"
      )}
      role="application"
    >
      <div className="text-ui-fg-subtle grid gap-1.5 px-1.5 md:grid-cols-2">
        <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
          {t("priceLists.fields.customerAvailability.attribute")}
        </div>
        <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
          {t("operators.in")}
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-1.5">
        <StackedFocusModal id={stackedId}>
          <StackedFocusModal.Trigger asChild>
            <button
              type="button"
              className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover shadow-borders-base txt-compact-small text-ui-fg-muted transition-fg focus-visible:shadow-borders-interactive-with-active flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5 outline-none"
            >
              <MagnifyingGlass />
              {t("priceLists.fields.customerAvailability.placeholder")}
            </button>
          </StackedFocusModal.Trigger>
          <StackedFocusModal.Trigger asChild>
            <Button variant="secondary">{t("actions.browse")}</Button>
          </StackedFocusModal.Trigger>
          <StackedFocusModal.Content>
            <StackedFocusModal.Header />
            <PriceListCustomerGroupRuleForm
              state={selected}
              setState={handleAdd}
              type="focus"
            />
          </StackedFocusModal.Content>
        </StackedFocusModal>
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-col gap-y-1.5">
          <Divider variant="dashed" />
          <div className="flex flex-col gap-y-1.5 px-1.5">
            {selected.map((field, index) => (
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
                  <XMarkMini />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
