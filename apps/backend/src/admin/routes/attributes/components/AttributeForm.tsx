import {
  Text,
  Input,
  Label,
  Select,
  Textarea,
  Switch,
  InlineTip,
} from "@medusajs/ui";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { AttributeDTO } from "@mercurjs/framework";
import { AdminUpdateAttribute, CreateAttribute } from "../../../../api/admin/attributes/validators";
import { AdminProductCategory } from "@medusajs/types";
import PossibleValuesList from "../create/components/PossibleValuesList";
import MultiSelectCategory from "../create/components/MultiSelectCategory";

enum AttributeUIComponent {
  SELECT = 'select',
  MULTIVALUE = 'multivalue',
  UNIT = 'unit',
  TOGGLE = 'toggle',
  TEXTAREA = 'text_area'
}

export const CreateAttributeFormSchema = CreateAttribute;

type CreateFormValues = z.infer<typeof CreateAttributeFormSchema>;

export const UdpateAttributeFormSchema = AdminUpdateAttribute;

type UpdateFormValues = z.infer<typeof UdpateAttributeFormSchema>;
interface AttributeFormProps {
  initialData?: AttributeDTO;
  onSubmit: (data: CreateFormValues | UpdateFormValues) => Promise<void>;
  categories?: AdminProductCategory[]
  mode?: 'create' | 'update'
  activeTab?: "details" | "type";
  onFormStateChange?: (formState: {
    detailsStatus: "not-started" | "in-progress" | "completed";
    typeStatus: "not-started" | "in-progress" | "completed";
  }) => void;
  onFormRef?: (form: any) => void;
}

export const AttributeForm = ({
  initialData,
  onSubmit,
  categories,
  mode = 'create',
  activeTab = "details",
  onFormStateChange,
  onFormRef
}: AttributeFormProps) => {
  const [showCategorySection, setShowCategorySection] = useState(
    (initialData?.product_categories?.length || 0) > 0
  );

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(mode === 'create' ? CreateAttributeFormSchema : UdpateAttributeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      handle: initialData?.handle || "",
      ui_component: initialData?.ui_component || AttributeUIComponent.SELECT,
      is_filterable: initialData?.is_filterable ?? true,
      is_required: initialData?.is_required ?? false,
      //@ts-ignore
      possible_values: initialData?.possible_values || [],
      product_category_ids: initialData?.product_categories?.map(c => c.id) || [],
      //@ts-ignore
      metadata: initialData?.metadata || {},
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
    }
  });

  // Determine tab statuses based on form data
  const getTabStatus = () => {
    const formData = form.getValues();

    // Details tab status
    const hasName = formData.name?.trim();
    const hasDetailsData = formData.description?.trim() || formData.handle?.trim() || formData.product_category_ids?.length;
    const detailsStatus = hasName ? "completed" : hasDetailsData ? "in-progress" : "not-started";

    // Type tab status
    const hasTypeData = formData.ui_component && (formData.possible_values?.length || 0) > 0;
    const typeStatus = hasTypeData ? "completed" : "not-started";

    return {
      detailsStatus: detailsStatus as "not-started" | "in-progress" | "completed",
      typeStatus: typeStatus as "not-started" | "in-progress" | "completed"
    };
  };

  useEffect(() => {
    if (onFormStateChange) {
      const statuses = getTabStatus();
      onFormStateChange(statuses);
    }
  }, [form.watch(), onFormStateChange]);

  useEffect(() => {
    if (onFormRef) {
      onFormRef(form);
    }
  }, [form, onFormRef]);

  const renderDetailsTab = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label size="small" htmlFor="name">Name</Label>
          <Input size="small" id="name" className="mt-1" {...form.register("name")} />
          {form.formState.errors.name && (
            <Text className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </Text>
          )}
        </div>
        <div>
          <Label size="small" htmlFor="handle">Handle <span className="text-ui-fg-subtle text-xs">(Optional)</span></Label>
          <div className="relative">
            <Input size="small" id="handle" className="pl-9 mt-1" {...form.register("handle")} />
            <div className="absolute z-100 left-0 top-1 bottom-0 flex items-center justify-center px-2 w-7 border-r border-ui-border-base text-ui-fg-muted">/</div>
            {form.formState.errors.handle && (
              <Text className="text-red-500 text-sm mt-1">
                {form.formState.errors.handle.message}
              </Text>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label size="small" htmlFor="description">Description <span className="text-ui-fg-subtle text-xs">(Optional)</span></Label>
          <Textarea className="mt-1"
            id="description"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <Text className="text-red-500 text-sm mt-1">
              {form.formState.errors.description.message}
            </Text>
          )}
        </div>

        <div className="bg-ui-bg-component p-4 rounded-lg shadow-elevation-card-rest">
          <div className="flex gap-3">
            <Switch
              id="is_filterable"
              checked={form.watch("is_filterable")}
              onCheckedChange={(checked) =>
                form.setValue("is_filterable", checked)
              }
              className="mt-1"
            />
            <div>
              <Label size="small" htmlFor="is_filterable">Yes, this is a filterable attribute</Label>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                If checked, buyers will be able to filter products using this attribute.
              </Text>
            </div>
          </div>
        </div>

        <div className="bg-ui-bg-component p-4 rounded-lg shadow-elevation-card-rest">
          <div className="flex gap-3">
            <Switch
              id="is_required"
              checked={form.watch("is_required")}
              onCheckedChange={(checked) =>
                form.setValue("is_required", checked)
              }
              className="mt-1"
            />
            <div>
              <Label size="small" htmlFor="is_required">Yes, this is a required attribute</Label>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                If checked, vendors must set a value to this attribute.
              </Text>
            </div>
          </div>
        </div>

        <div className="bg-ui-bg-component p-4 rounded-lg shadow-elevation-card-rest">
          <div className="flex gap-3">
            <Switch
              id="is_global"
              checked={!form.watch("product_category_ids")?.length && !showCategorySection}
              onCheckedChange={(checked) => {
                if (checked) {
                  form.setValue("product_category_ids", []);
                  setShowCategorySection(false);
                } else {
                  setShowCategorySection(true);
                }
              }}
              className="mt-1"
            />
            <div>
              <Label size="small" htmlFor="is_global">Yes, this is a global attribute</Label>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                If checked, this attribute will be available for all products regardless of category.
              </Text>
            </div>
          </div>
        </div>

        {(showCategorySection || (form.watch("product_category_ids")?.length || 0) > 0) && (
          <div>
            <Label size="small" htmlFor="product_categories">
              Category
            </Label>
            <div className="mt-1">
              <MultiSelectCategory
                categories={categories || []}
                value={form.watch("product_category_ids") || []}
                onChange={(value) =>
                  form.setValue("product_category_ids", value)
                }
              />
              {form.formState.errors.product_category_ids && (
                <Text className="text-red-500 text-sm mt-1">
                  {form.formState.errors.product_category_ids.message}
                </Text>
              )}
            </div>

          </div>
        )}
        <div className={`mt-3 ${!(showCategorySection || (form.watch("product_category_ids")?.length || 0) > 0) && 'collapse'}`}>
          <InlineTip label="Warning" variant="warning">
            All child categories of the selected category will automatically inherit its attributes.
          </InlineTip>
        </div>
      </div>
    </div>
  );

  const renderTypeTab = () => (
    <div className="grid gap-6 w-[720px]">
      <div>
        <Label size="small" htmlFor="ui_component">Type</Label>
        <Select
          value={form.watch("ui_component")}
          onValueChange={(value) =>
            form.setValue(
              "ui_component",
              value as AttributeUIComponent
            )
          }
        >
          <Select.Trigger className="mt-1">
            <Select.Value placeholder="Select Type" />
          </Select.Trigger>
          <Select.Content>
            {Object.values(AttributeUIComponent).map((component) => (
              <Select.Item key={component} value={component}>
                {component === 'select' ? 'Single Select' :
                  component === 'multivalue' ? 'Multi Select' :
                    component === 'unit' ? 'Unit' :
                      component === 'toggle' ? 'Toggle' :
                        component === 'text_area' ? 'Text' :
                          component}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        {form.formState.errors.ui_component && (
          <Text className="text-red-500 text-sm mt-1">
            {form.formState.errors.ui_component.message}
          </Text>
        )}
      </div>

      {form.watch("ui_component") === AttributeUIComponent.SELECT && (
        <InlineTip label="Tip" variant="info" >
          When creating Single Select vendor will be able to choose only one value. This type of attribute will be good for product specifications.
        </InlineTip>
      )}

      {(form.watch("ui_component") === AttributeUIComponent.SELECT || form.watch("ui_component") === AttributeUIComponent.MULTIVALUE) && (
        <div>
          <PossibleValuesList />
        </div>
      )}
    </div>
  );

  return (
    <FormProvider {...form}>
      <form id="attribute-form" onSubmit={handleSubmit}>
        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "type" && renderTypeTab()}
      </form>
    </FormProvider>
  );
}; 