import {
  Text,
  Input,
  Label,
  Select,
  Textarea,
  Switch,
} from "@medusajs/ui";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  TEXTAREA = 'text_area',
  COLOR_PICKER = 'color_picker'
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
}

export const AttributeForm = ({
  initialData,
  onSubmit,
  categories,
  mode = 'create'
}: AttributeFormProps) => {

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(mode === 'create' ? CreateAttributeFormSchema : UdpateAttributeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      handle: initialData?.handle || "",
      ui_component: mode === 'update' ? undefined : initialData?.ui_component || AttributeUIComponent.SELECT,
      is_filterable: initialData?.is_filterable ?? true,
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

  return (
    <FormProvider {...form}>
      <form id="attribute-form" onSubmit={handleSubmit}>
        <div className="grid gap-4">
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
              <Label size="small" htmlFor="handle">Handle</Label>
              <Input size="small" id="handle" className="mt-1" {...form.register("handle")} />
              {form.formState.errors.handle && (
                <Text className="text-red-500 text-sm mt-1">
                  {form.formState.errors.handle.message}
                </Text>
              )}
            </div>
          </div>

          <div>
            <Label size="small" htmlFor="description">Description</Label>
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

          <div className="flex items-center gap-2">
              <Switch
                id="is_filterable"
                checked={form.watch("is_filterable")}
                onCheckedChange={(checked) =>
                  form.setValue("is_filterable", checked)
                }
              />
              <Label size="small" htmlFor="is_filterable">Filterable</Label>
          </div>


          {(
            <div>
              <Label size="small" htmlFor="product_categories">
                Product Categories
              </Label>
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
          )}


          <div>
            <Label size="small" htmlFor="ui_component">UI Component</Label>
            <Select
              value={form.watch("ui_component")}
              onValueChange={(value) =>
                form.setValue(
                  "ui_component",
                  value as AttributeUIComponent
                )
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="Select UI Component" />
              </Select.Trigger>
              <Select.Content>
                {Object.values(AttributeUIComponent).map((component) => (
                  <Select.Item key={component} value={component}>
                    {component}
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
            <div className="mt-4">
              <PossibleValuesList />
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}; 