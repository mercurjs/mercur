import { Heading, Input, Text, Textarea } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { SwitchBox } from "../../../../components/common/switch-box";
import { HandleInput } from "../../../../components/inputs/handle-input";
import { CategoryCombobox } from "../../../products/common/components/category-combobox";
import { useTabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { defineTabMeta } from "../../../../components/tabbed-form/types";

type AttributeCreateFormValues = {
  name: string;
  handle?: string;
  description?: string;
  is_filterable: boolean;
  is_required: boolean;
  is_variant_axis: boolean;
  category_ids?: string[];
};

const Root = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<AttributeCreateFormValues>();

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="attribute-create-details-tab"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading level="h2">{t("attributes.create.header")}</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("attributes.create.subtitle")}
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("attributes.fields.name")}</Form.Label>
                <Form.Control>
                  <Input {...field} data-testid="attribute-create-name-input" />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("attributes.fields.handle")}
                </Form.Label>
                <Form.Control>
                  <HandleInput
                    {...field}
                    data-testid="attribute-create-handle-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>

        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item>
              <Form.Label optional>
                {t("attributes.fields.description")}
              </Form.Label>
              <Form.Control>
                <Textarea
                  {...field}
                  data-testid="attribute-create-description-input"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <div className="flex flex-col gap-y-4">
          <SwitchBox
            control={form.control}
            name="is_required"
            label={t("attributes.fields.isRequired", "Required attribute")}
            description={t(
              "attributes.fields.isRequiredHint",
              "If checked, vendors must set a value for this attribute.",
            )}
            data-testid="attribute-create-required-switch"
          />

          <SwitchBox
            control={form.control}
            name="is_filterable"
            label={t("attributes.fields.isFilterable", "Filterable attribute")}
            description={t(
              "attributes.fields.isFilterableHint",
              "If checked, buyers will be able to filter products using this attribute.",
            )}
            data-testid="attribute-create-filterable-switch"
          />
        </div>

        <Form.Field
          control={form.control}
          name="category_ids"
          render={({ field }) => (
            <Form.Item>
              <Form.Label optional>
                {t("attributes.fields.categories")}
              </Form.Label>
              <Form.Control>
                <CategoryCombobox
                  value={field.value ?? []}
                  onChange={field.onChange}
                  data-testid="attribute-create-categories-combobox"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>
    </div>
  );
};

Root._tabMeta = defineTabMeta<AttributeCreateFormValues>({
  id: "details",
  labelKey: "attributes.create.tabs.details",
  validationFields: ["name"],
});

export const AttributeCreateDetailsTab = Root;
