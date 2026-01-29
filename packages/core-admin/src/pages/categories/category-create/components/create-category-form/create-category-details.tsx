import { Heading, Input, Select, Text, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { CreateCategorySchema } from "./schema"

type CreateCategoryDetailsProps = {
  form: UseFormReturn<CreateCategorySchema>
}

export const CreateCategoryDetails = ({ form }: CreateCategoryDetailsProps) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8" data-testid="category-create-form-content">
        <div data-testid="category-create-form-header">
          <Heading data-testid="category-create-form-heading">{t("categories.create.header")}</Heading>
          <Text size="small" className="text-ui-fg-subtle" data-testid="category-create-form-hint">
            {t("categories.create.hint")}
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="category-create-form-name-item">
                  <Form.Label data-testid="category-create-form-name-label">{t("fields.title")}</Form.Label>
                  <Form.Control data-testid="category-create-form-name-control">
                    <Input autoComplete="off" {...field} data-testid="category-create-form-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="category-create-form-name-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item data-testid="category-create-form-handle-item">
                  <Form.Label optional tooltip={t("collections.handleTooltip")} data-testid="category-create-form-handle-label">
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control data-testid="category-create-form-handle-control">
                    <HandleInput {...field} data-testid="category-create-form-handle-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="category-create-form-handle-error" />
                </Form.Item>
              )
            }}
          />
        </div>
        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => {
            return (
              <Form.Item data-testid="category-create-form-description-item">
                <Form.Label optional data-testid="category-create-form-description-label">{t("fields.description")}</Form.Label>
                <Form.Control data-testid="category-create-form-description-control">
                  <Textarea {...field} data-testid="category-create-form-description-textarea" />
                </Form.Control>
                <Form.ErrorMessage data-testid="category-create-form-description-error" />
              </Form.Item>
            )
          }}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="status"
            render={({ field: { ref, onChange, ...field } }) => {
              return (
                <Form.Item data-testid="category-create-form-status-item">
                  <Form.Label data-testid="category-create-form-status-label">{t("categories.fields.status.label")}</Form.Label>
                  <Form.Control data-testid="category-create-form-status-control">
                    <Select
                      dir={direction}
                      {...field}
                      onValueChange={onChange}
                      data-testid="category-create-form-status-select"
                    >
                      <Select.Trigger ref={ref} data-testid="category-create-form-status-select-trigger">
                        <Select.Value data-testid="category-create-form-status-select-value" />
                      </Select.Trigger>
                      <Select.Content data-testid="category-create-form-status-select-content">
                        <Select.Item value="active" data-testid="category-create-form-status-select-option-active">
                          {t("categories.fields.status.active")}
                        </Select.Item>
                        <Select.Item value="inactive" data-testid="category-create-form-status-select-option-inactive">
                          {t("categories.fields.status.inactive")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="category-create-form-status-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="visibility"
            render={({ field: { ref, onChange, ...field } }) => {
              return (
                <Form.Item data-testid="category-create-form-visibility-item">
                  <Form.Label data-testid="category-create-form-visibility-label">
                    {t("categories.fields.visibility.label")}
                  </Form.Label>
                  <Form.Control data-testid="category-create-form-visibility-control">
                    <Select
                      dir={direction}
                      {...field}
                      onValueChange={onChange}
                      data-testid="category-create-form-visibility-select"
                    >
                      <Select.Trigger ref={ref} data-testid="category-create-form-visibility-select-trigger">
                        <Select.Value data-testid="category-create-form-visibility-select-value" />
                      </Select.Trigger>
                      <Select.Content data-testid="category-create-form-visibility-select-content">
                        <Select.Item value="public" data-testid="category-create-form-visibility-select-option-public">
                          {t("categories.fields.visibility.public")}
                        </Select.Item>
                        <Select.Item value="internal" data-testid="category-create-form-visibility-select-option-internal">
                          {t("categories.fields.visibility.internal")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="category-create-form-visibility-error" />
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
