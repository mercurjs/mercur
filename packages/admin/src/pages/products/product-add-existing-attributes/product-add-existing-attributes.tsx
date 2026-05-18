import { XMarkMini } from "@medusajs/icons";
import {
  Badge,
  Button,
  createDataTableColumnHelper,
  DataTableRowSelectionState,
  Heading,
  IconButton,
  InlineTip,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui";
import { AttributeType, ProductAttributeDTO } from "@mercurjs/types";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { keepPreviousData } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

import { DataTable } from "../../../components/data-table";
import { AttributeValueInput } from "../../../components/inputs/attribute-value-input";
import { Form } from "../../../components/common/form";
import { RouteFocusModal, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import { useProductAttributes } from "../../../hooks/api";
import { useBatchProductAttributes } from "../../../hooks/api/products";
import { useAttributeTableQuery } from "../../../hooks/table/query/use-attribute-table-query";
import { useAttributeTableFilters } from "../../../hooks/table/filters/use-attribute-table-filters";

const PAGE_SIZE = 20;
const PREFIX = "add-existing-attrs";
const MAX_VISIBLE_VALUES = 2;

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  single_select: "attributes.type.select",
  multi_select: "attributes.type.multivalue",
  unit: "attributes.type.unit",
  toggle: "attributes.type.toggle",
  text: "attributes.type.text_area",
};

// --- Zod schema for values step ---

const AttributeValueSchema = zod.object({
  attribute_id: zod.string(),
  name: zod.string(),
  type: zod.string(),
  is_variant_axis: zod.boolean(),
  available_values: zod.array(
    zod.object({ id: zod.string(), name: zod.string() })
  ),
  values: zod
    .union([zod.string(), zod.array(zod.string())])
    .refine(
      (val) => {
        if (Array.isArray(val)) return val.length > 0;
        return val.length > 0;
      },
      { message: "Value is required" }
    ),
});

const AddExistingAttributesSchema = zod.object({
  attributes: zod.array(AttributeValueSchema),
});

type AddExistingFormValues = zod.infer<typeof AddExistingAttributesSchema>;

// --- Component ---

export const ProductAddExistingAttributes = () => {
  const { id: productId } = useParams();

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <Content productId={productId!} />
    </RouteFocusModal>
  );
};

const Content = ({ productId }: { productId: string }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const [step, setStep] = useState<"select" | "values">("select");
  const [rowSelection, setRowSelection] =
    useState<DataTableRowSelectionState>({});

  const { searchParams } = useAttributeTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });
  const { product_attributes, count, isLoading, isError, error } =
    useProductAttributes(searchParams, {
      placeholderData: keepPreviousData,
    });

  const { mutateAsync, isPending } = useBatchProductAttributes(productId);

  const form = useForm<AddExistingFormValues>({
    defaultValues: { attributes: [] },
    resolver: zodResolver(AddExistingAttributesSchema),
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const filters = useAttributeTableFilters();
  const columns = useColumns();

  if (isError) {
    throw error;
  }

  const handleContinue = () => {
    const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id]
    );
    if (!selectedIds.length) return;

    const attrs = selectedIds
      .map((id) => product_attributes?.find((a) => a.id === id))
      .filter(Boolean)
      .map((attr) => ({
        attribute_id: attr!.id,
        name: attr!.name,
        type: attr!.type,
        is_variant_axis: attr!.is_variant_axis,
        available_values:
          attr!.values?.map((v) => ({ id: v.id, name: v.name })) ?? [],
        values:
          attr!.type === AttributeType.MULTI_SELECT
            ? ([] as string[])
            : "",
      }));

    form.reset({ attributes: attrs });
    setStep("values");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleRemoveAttr = (index: number, attrId: string) => {
    remove(index);
    setRowSelection((prev) => {
      const next = { ...prev };
      delete next[attrId];
      return next;
    });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    const batchCreate: {
      attribute_id: string;
      attribute_value_ids?: string[];
      values?: string[];
    }[] = [];

    for (const attr of data.attributes) {
      const vals = Array.isArray(attr.values)
        ? attr.values
        : attr.values
          ? [attr.values]
          : [];

      const hasPresetValues =
        attr.type === "single_select" || attr.type === "multi_select";

      if (hasPresetValues) {
        const nameToId = new Map(
          attr.available_values.map((v) => [v.name, v.id])
        );
        const valueIds = vals
          .map((name) => nameToId.get(name))
          .filter(Boolean) as string[];
        batchCreate.push({
          attribute_id: attr.attribute_id,
          attribute_value_ids: valueIds.length ? valueIds : undefined,
        });
      } else {
        batchCreate.push({
          attribute_id: attr.attribute_id,
          values: vals.length ? vals : undefined,
        });
      }
    }

    await mutateAsync(
      { create: batchCreate },
      {
        onSuccess: () => {
          handleSuccess();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  });

  return (
    <>
      {step === "select" ? (
        <>
          <RouteFocusModal.Body className="flex-1 overflow-hidden">
            <DataTable
              data={product_attributes}
              columns={columns}
              filters={filters as any}
              rowCount={count}
              pageSize={PAGE_SIZE}
              getRowId={(row) => row.id}
              rowSelection={{
                state: rowSelection,
                onRowSelectionChange: setRowSelection,
              }}
              isLoading={isLoading}
              layout="fill"
              prefix={PREFIX}
            />
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button size="small" variant="secondary" type="button">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                size="small"
                type="button"
                onClick={handleContinue}
                disabled={!Object.values(rowSelection).some(Boolean)}
              >
                {t("actions.continue")}
              </Button>
            </div>
          </RouteFocusModal.Footer>
        </>
      ) : (
        <RouteFocusModal.Form form={form}>
        <KeyboundForm
          onSubmit={handleSubmit}
          className="flex h-full flex-col"
        >
          <RouteFocusModal.Body className="flex-1 overflow-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 p-16">
              <div>
                <Heading level="h2">
                  {t("products.create.attributes.header")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  {t("products.create.attributes.description")}
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                {fields.map((field, index) => (
                  <div
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
                        value={field.name}
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
                      <Form.Field
                        control={form.control}
                        name={`attributes.${index}.values`}
                        render={({
                          field: { onChange, value },
                        }) => (
                          <Form.Item>
                            <Form.Control>
                              <AttributeValueInput
                                type={field.type}
                                value={value}
                                onChange={onChange}
                                availableValues={field.available_values}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )}
                      />
                      {field.is_variant_axis && (
                        <>
                          <div />
                          <InlineTip
                            label={t("products.create.attributes.tip")}
                          >
                            {t(
                              "products.create.attributes.variantAxisTip"
                            )}
                          </InlineTip>
                        </>
                      )}
                    </div>
                    <IconButton
                      type="button"
                      size="small"
                      variant="transparent"
                      className="text-ui-fg-muted"
                      onClick={() =>
                        handleRemoveAttr(index, field.attribute_id)
                      }
                    >
                      <XMarkMini />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={handleBack}
              >
                {t("actions.back")}
              </Button>
              <Button
                size="small"
                type="submit"
                isLoading={isPending}
                disabled={!fields.length}
              >
                {t("actions.save")}
              </Button>
            </div>
          </RouteFocusModal.Footer>
        </KeyboundForm>
        </RouteFocusModal.Form>
      )}
    </>
  );
};

const columnHelper = createDataTableColumnHelper<ProductAttributeDTO>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.select(),
      columnHelper.accessor("name", {
        header: t("attributes.fields.name"),
        enableSorting: false,
      }),
      columnHelper.accessor("type", {
        header: t("attributes.fields.type"),
        cell: (info) => {
          const type = info.getValue();
          const labelKey = ATTRIBUTE_TYPE_LABELS[type];
          return labelKey ? t(labelKey) : type;
        },
        enableSorting: false,
      }),
      columnHelper.accessor("is_variant_axis", {
        header: t("attributes.fields.variantAxis"),
        cell: (info) =>
          info.getValue()
            ? t("filters.radio.yes")
            : t("filters.radio.no"),
        enableSorting: false,
      }),
      columnHelper.display({
        id: "values",
        header: t("attributes.fields.values"),
        cell: ({ row }) => {
          const values = row.original.values ?? [];
          if (!values.length) {
            return <span className="text-ui-fg-muted">-</span>;
          }
          const visible = values.slice(0, MAX_VISIBLE_VALUES);
          const remaining = values.length - MAX_VISIBLE_VALUES;
          return (
            <div className="flex items-center gap-x-1">
              {visible.map((v) => (
                <Badge key={v.id} size="2xsmall" color="grey">
                  {v.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge size="2xsmall" color="grey">
                  +{remaining}
                </Badge>
              )}
            </div>
          );
        },
      }),
    ],
    [t]
  );
};
