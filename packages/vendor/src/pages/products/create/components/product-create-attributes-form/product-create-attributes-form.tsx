import { XMarkMini } from "@medusajs/icons";
import {
  Button,
  Heading,
  Hint,
  IconButton,
  InlineTip,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
} from "@medusajs/ui";
import { AttributeType, ProductAttributeDTO } from "@mercurjs/types";
import { useEffect } from "react";
import {
  Controller,
  FieldArrayWithId,
  UseFieldArrayRemove,
  useFieldArray,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "@components/common/form";
import { ChipInput } from "@components/inputs/chip-input";
import { Combobox } from "@components/inputs/combobox";
import { StackedFocusModal, useStackedModal } from "@components/modals";
import { useTabbedForm } from "@components/tabbed-form/tabbed-form";
import { defineTabMeta } from "@components/tabbed-form/types";
import { useProductAttributes } from "@hooks/api";

import { ProductCreateSchemaType } from "../../types";
import {
  ADD_ATTRIBUTES_MODAL_ID,
  ProductCreateAddAttributesModal,
} from "./product-create-add-attributes-modal";

const Root = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<ProductCreateSchemaType>();
  const { setIsOpen } = useStackedModal();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const handleCreateNew = () => {
    append({
      attribute_id: undefined,
      title: "",
      values: [],
      is_custom: true,
      use_for_variants: false,
    });
  };

  const handleAddExisting = () => {
    setIsOpen(ADD_ATTRIBUTES_MODAL_ID, true);
  };

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-attributes-form"
    >
      <StackedFocusModal id={ADD_ATTRIBUTES_MODAL_ID}>
        <ProductCreateAddAttributesModal />
      </StackedFocusModal>

      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading level="h2">{t("products.create.attributes.header")}</Heading>
          <Text
            size="small"
            className="text-ui-fg-subtle mt-1 whitespace-pre-line"
          >
            {t("products.create.attributes.description")}
          </Text>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleAddExisting}
          >
            {t("products.create.attributes.addExisting")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleCreateNew}
          >
            {t("products.create.attributes.createNew")}
          </Button>
        </div>

        {fields.some((f) => !f.is_custom && !!f.attribute_id) && (
          <SelectedAttributes fields={fields} remove={remove} />
        )}

        {fields.some((f) => f.is_custom) && (
          <ul className="flex flex-col gap-y-4">
            {fields.map((field, index) => {
              if (!field.is_custom) return null;
              const useForVariants = form.watch(
                `attributes.${index}.use_for_variants`,
              );

              return (
                <li
                  key={field.id}
                  className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-start gap-1.5 rounded-xl p-1.5"
                >
                  <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
                    <div className="flex items-center px-2 py-1.5">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle"
                        htmlFor={`attributes.${index}.title`}
                      >
                        {t("fields.title")}
                      </Label>
                    </div>
                    <Input
                      className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                      {...form.register(`attributes.${index}.title` as const)}
                      placeholder={t(
                        "products.create.attributes.titlePlaceholder",
                      )}
                    />
                    <div className="flex items-center px-2 py-1.5">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle"
                        htmlFor={`attributes.${index}.values`}
                      >
                        {t("fields.values")}
                      </Label>
                    </div>
                    <Controller
                      control={form.control}
                      name={`attributes.${index}.values` as const}
                      render={({ field: { onChange, value, ...field } }) =>
                        useForVariants ? (
                          <ChipInput
                            {...field}
                            variant="contrast"
                            value={Array.isArray(value) ? value : []}
                            onChange={onChange}
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder",
                            )}
                          />
                        ) : (
                          <Textarea
                            {...field}
                            className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                            value={
                              Array.isArray(value)
                                ? (value[0] ?? "")
                                : (value ?? "")
                            }
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder",
                            )}
                          />
                        )
                      }
                    />
                    <div />
                    <Form.Field
                      control={form.control}
                      name={`attributes.${index}.use_for_variants`}
                      render={({ field: { value, onChange, ref } }) => (
                        <Form.Item>
                          <div className="flex items-start gap-x-3 py-1.5">
                            <Form.Control>
                              <Switch
                                ref={ref}
                                className="shrink-0 rtl:rotate-180"
                                checked={value}
                                onCheckedChange={onChange}
                              />
                            </Form.Control>
                            <div className="flex flex-col">
                              <Label size="xsmall" weight="plus">
                                {t("products.create.attributes.useForVariants")}
                              </Label>
                              <Hint className="!txt-small">
                                {t(
                                  "products.create.attributes.useForVariantsDescription",
                                )}
                              </Hint>
                            </div>
                          </div>
                        </Form.Item>
                      )}
                    />
                  </div>
                  <IconButton
                    type="button"
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-muted"
                    onClick={() => remove(index)}
                  >
                    <XMarkMini />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}

        <RequiredAttributes />
      </div>
    </div>
  );
};

const SelectedAttributes = ({
  fields,
  remove,
}: {
  fields: FieldArrayWithId<ProductCreateSchemaType, "attributes", "id">[];
  remove: UseFieldArrayRemove;
}) => {
  const { t } = useTranslation();
  const form = useTabbedForm<ProductCreateSchemaType>();

  const entries = fields
    .map((field, index) => ({ field, index }))
    .filter(
      ({ field }) =>
        !field.is_custom && !field.is_required && !!field.attribute_id,
    );

  if (!entries.length) return null;

  return (
    <ul className="flex flex-col gap-y-4">
      {entries.map(({ field, index }) => {
        const attrType = field.type as AttributeType | undefined;
        const availableValues = field.available_values ?? [];

        return (
          <li
            key={field.id}
            className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-start gap-1.5 rounded-xl p-1.5"
          >
            <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
              <div className="flex items-center px-2 py-1.5">
                <Label
                  size="xsmall"
                  weight="plus"
                  className="text-ui-fg-subtle"
                >
                  {t("fields.title")}
                </Label>
              </div>
              <Input
                value={field.title}
                disabled
                className="bg-ui-bg-field-component"
              />
              <div className="flex items-center px-2 py-1.5">
                <Label
                  size="xsmall"
                  weight="plus"
                  className="text-ui-fg-subtle"
                >
                  {t("fields.values")}
                </Label>
              </div>
              {attrType === AttributeType.MULTI_SELECT ? (
                <Controller
                  control={form.control}
                  name={`attributes.${index}.values`}
                  render={({ field: { onChange, value, ref, ...rest } }) => (
                    <Combobox
                      {...rest}
                      ref={ref}
                      value={Array.isArray(value) ? value : []}
                      onChange={(val) => onChange(val ?? [])}
                      options={availableValues.map((v) => ({
                        value: v.name,
                        label: v.name,
                      }))}
                      placeholder={t("products.create.attributes.selectValues")}
                    />
                  )}
                />
              ) : attrType === AttributeType.SINGLE_SELECT ? (
                <Controller
                  control={form.control}
                  name={`attributes.${index}.values`}
                  render={({ field: { onChange, value, ref, ...rest } }) => (
                    <Select
                      {...rest}
                      value={
                        typeof value === "string" ? value : (value?.[0] ?? "")
                      }
                      onValueChange={onChange}
                    >
                      <Select.Trigger ref={ref}>
                        <Select.Value
                          placeholder={t(
                            "products.create.attributes.selectValues",
                          )}
                        />
                      </Select.Trigger>
                      <Select.Content>
                        {availableValues.map((v) => (
                          <Select.Item key={v.id} value={v.name}>
                            {v.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  )}
                />
              ) : attrType === AttributeType.TEXT ? (
                <Controller
                  control={form.control}
                  name={`attributes.${index}.values`}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Textarea
                      {...rest}
                      className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                      value={
                        typeof value === "string" ? value : (value?.[0] ?? "")
                      }
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={t(
                        "products.create.attributes.valuePlaceholder",
                      )}
                    />
                  )}
                />
              ) : attrType === AttributeType.TOGGLE ? (
                <Controller
                  control={form.control}
                  name={`attributes.${index}.values`}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Select
                      {...rest}
                      value={
                        typeof value === "string" ? value : (value?.[0] ?? "")
                      }
                      onValueChange={onChange}
                    >
                      <Select.Trigger>
                        <Select.Value
                          placeholder={t(
                            "products.create.attributes.selectValues",
                          )}
                        />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="true">
                          {t("filters.radio.yes")}
                        </Select.Item>
                        <Select.Item value="false">
                          {t("filters.radio.no")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  )}
                />
              ) : (
                <Controller
                  control={form.control}
                  name={`attributes.${index}.values`}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Input
                      {...rest}
                      value={
                        typeof value === "string" ? value : (value?.[0] ?? "")
                      }
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={t(
                        "products.create.attributes.valuePlaceholder",
                      )}
                    />
                  )}
                />
              )}
              {field.use_for_variants && (
                <>
                  <div />
                  <VariantAxisTip />
                </>
              )}
            </div>
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              className="text-ui-fg-muted"
              onClick={() => remove(index)}
            >
              <XMarkMini />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
};

const RequiredAttributes = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<ProductCreateSchemaType>();
  const categoryId = form.watch("category_id");

  const { product_attributes } = useProductAttributes(
    {
      category_id: categoryId,
      is_required: true,
    },
    { enabled: !!categoryId },
  );

  const attributes = form.watch("attributes") || [];

  useEffect(() => {
    if (!product_attributes) return;

    const currentAttributes = form.getValues("attributes") || [];
    const requiredIds = new Set(product_attributes.map((a: any) => a.id));

    // Keep all non-required attributes (custom + modal-added) untouched
    const otherAttributes = currentAttributes.filter(
      (a) => a.is_custom || !requiredIds.has(a.attribute_id ?? ""),
    );

    // Merge required attributes — preserve existing values if already in form
    const requiredAttributes = product_attributes.map((attr: any) => {
      const existing = currentAttributes.find(
        (a) => a.attribute_id === attr.id,
      );
      if (existing) return existing;

      return {
        attribute_id: attr.id,
        title: attr.name,
        values:
          attr.type === AttributeType.MULTI_SELECT ? ([] as string[]) : "",
        is_custom: false,
        is_required: true,
        use_for_variants: attr.is_variant_axis,
      };
    });

    form.setValue("attributes", [...otherAttributes, ...requiredAttributes]);
  }, [product_attributes]);

  if (!categoryId || !product_attributes?.length) return null;

  const requiredEntries = attributes
    .map((attr, index) => ({ attr, index }))
    .filter(({ attr }) => !attr.is_custom);

  return (
    <>
      <div className="border-ui-border-base border-t border-dashed" />

      <div className="flex flex-col gap-y-6">
        <div>
          <Text size="small" weight="plus" leading="compact">
            {t("products.create.attributes.requiredAttributes")}
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.create.attributes.requiredAttributesHint")}
          </Text>
        </div>

        {requiredEntries.map(({ attr, index }) => {
          const apiAttr = product_attributes.find(
            (a: any) => a.id === attr.attribute_id,
          );
          if (!apiAttr) return null;

          return (
            <RequiredAttributeField
              key={apiAttr.id}
              attribute={apiAttr}
              index={index}
            />
          );
        })}
      </div>
    </>
  );
};

const RequiredAttributeField = ({
  attribute,
  index,
}: {
  attribute: ProductAttributeDTO;
  index: number;
}) => {
  const { t } = useTranslation();
  const form = useTabbedForm<ProductCreateSchemaType>();

  return (
    <Form.Field
      control={form.control}
      name={`attributes.${index}.values`}
      render={({ field: { onChange, value, ref, ...field } }) => (
        <Form.Item>
          <Form.Label>{attribute.name}</Form.Label>

          <Form.Control>
            {attribute.type === AttributeType.SINGLE_SELECT ? (
              <Select
                {...field}
                value={typeof value === "string" ? value : (value?.[0] ?? "")}
                onValueChange={onChange}
              >
                <Select.Trigger ref={ref}>
                  <Select.Value
                    placeholder={t(
                      "products.create.attributes.valuePlaceholder",
                    )}
                  />
                </Select.Trigger>
                <Select.Content>
                  {attribute.values?.map((v) => (
                    <Select.Item key={v.id} value={v.name}>
                      {v.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            ) : attribute.type === AttributeType.MULTI_SELECT ? (
              <Combobox
                {...field}
                ref={ref}
                value={Array.isArray(value) ? value : []}
                onChange={(val) => onChange(val ?? [])}
                options={
                  attribute.values?.map((v) => ({
                    value: v.name,
                    label: v.name,
                  })) ?? []
                }
                placeholder={t("products.create.attributes.selectValues")}
              />
            ) : attribute.type === AttributeType.TEXT ? (
              <Input
                {...field}
                ref={ref}
                value={typeof value === "string" ? value : (value?.[0] ?? "")}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("products.create.attributes.valuePlaceholder")}
              />
            ) : attribute.type === AttributeType.TOGGLE ? (
              <Switch
                {...field}
                className="rtl:rotate-180"
                checked={value === "true" || (value as unknown) === true}
                onCheckedChange={(checked) => onChange(String(checked))}
              />
            ) : (
              <Input
                {...field}
                ref={ref}
                value={typeof value === "string" ? value : (value?.[0] ?? "")}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("products.create.attributes.valuePlaceholder")}
              />
            )}
          </Form.Control>
          <Form.ErrorMessage />

          {attribute.is_variant_axis && <VariantAxisTip />}
        </Form.Item>
      )}
    />
  );
};

const VariantAxisTip = () => {
  const { t } = useTranslation();

  return (
    <InlineTip label={t("products.create.attributes.tip")}>
      {t("products.create.attributes.variantAxisTip")}
    </InlineTip>
  );
};

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "attributes",
  labelKey: "products.create.tabs.attributes",
  validationFields: ["attributes"],
});

export const ProductCreateAttributesForm = Root;
