import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { DotsSix, XMark, TagIllustration } from "@medusajs/icons";
import {
  Button,
  clx,
  Heading,
  Hint,
  IconButton,
  Input,
  ProgressTabs,
  Text,
  toast,
} from "@medusajs/ui";
import {
  useFieldArray,
  useForm,
  useFormContext,
  FormProvider,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { RouteFocusModal, useRouteModal } from "../../../components/modals";
import {
  useProductAttribute,
  useUpsertProductAttributeValues,
} from "../../../hooks/api/product-attributes";

const CreatePossibleValuesSchema = z.object({
  new_values: z.array(
    z.object({
      id: z.string(),
      value: z.string().min(1),
    })
  ).min(1),
});

type CreatePossibleValuesFormValues = z.infer<typeof CreatePossibleValuesSchema>;

type RankingItem = {
  id: string;
  value: string;
  isNew: boolean;
};

// --- Sortable Item for Tab 1 (Values) ---

interface SortableValueInputProps {
  id: string;
  index: number;
  onRemove: () => void;
}

const SortableValueInput = ({
  id,
  index,
  onRemove,
}: SortableValueInputProps) => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = useFormContext<CreatePossibleValuesFormValues>();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldError = errors.new_values?.[index]?.value;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 p-1.5 bg-ui-bg-component shadow-elevation-card-rest rounded-xl mb-2"
      data-testid={`create-possible-value-input-item-${index}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        data-testid={`create-possible-value-drag-handle-${index}`}
      >
        <DotsSix className="text-ui-fg-subtle" />
      </button>
      <div className="flex-1">
        <Input
          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
          aria-invalid={!!fieldError}
          placeholder={t("attributes.createPossibleValues.enterValue")}
          {...register(`new_values.${index}.value`)}
          data-testid={`create-possible-value-input-${index}`}
        />
        {fieldError && (
          <Hint
            variant="error"
            className="mt-1"
            data-testid={`create-possible-value-error-${index}`}
          >
            {fieldError.message as string}
          </Hint>
        )}
      </div>
      <IconButton
        variant="transparent"
        size="small"
        type="button"
        onClick={onRemove}
        data-testid={`create-possible-value-remove-button-${index}`}
      >
        <XMark />
      </IconButton>
    </div>
  );
};

// --- Sortable Item for Tab 2 (Organize Ranking) ---

interface SortableRankingItemProps {
  id: string;
  value: string;
  index: number;
  isGhost?: boolean;
}

const SortableRankingItem = ({
  id,
  value,
  index,
  isGhost,
}: SortableRankingItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clx("-mb-px list-none", {
        "[&:first-of-type>div]:border-t-0": true,
      })}
      data-testid={`ranking-item-${index}`}
    >
      <div
        className={clx(
          "bg-ui-bg-base transition-fg relative flex items-center gap-x-3 border-y px-6 py-2.5",
          {
            "bg-ui-bg-base-hover z-[1] opacity-50": isGhost,
          }
        )}
      >
        <IconButton
          size="small"
          variant="transparent"
          type="button"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          data-testid={`ranking-item-drag-handle-${index}`}
        >
          <DotsSix />
        </IconButton>
        <div className="flex size-7 items-center justify-center">
          <TagIllustration />
        </div>
        <div className="txt-compact-small text-ui-fg-subtle flex-grow truncate">
          {value}
        </div>
      </div>
    </li>
  );
};

// --- Inner Form Component ---

const AttributeCreatePossibleValueInner = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { handleSuccess } = useRouteModal();

  const { product_attribute: attribute, isPending: isAttributeLoading } =
    useProductAttribute(id!);

  const { mutateAsync: upsertValues } = useUpsertProductAttributeValues(id!);

  const [activeTab, setActiveTab] = useState<"values" | "organize-ranking">(
    "values",
  );
  const [tabStatuses, setTabStatuses] = useState<{
    valuesStatus: "not-started" | "in-progress" | "completed";
    organizeStatus: "not-started" | "in-progress" | "completed";
  }>({
    valuesStatus: "not-started",
    organizeStatus: "not-started",
  });
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [rankingActiveId, setRankingActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CreatePossibleValuesFormValues>({
    defaultValues: {
      new_values: [{ id: crypto.randomUUID(), value: "" }],
    },
    resolver: zodResolver(CreatePossibleValuesSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "new_values",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleValuesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      const currentValues = form.getValues("new_values");
      const reordered = arrayMove(currentValues, oldIndex, newIndex);
      reordered.forEach((item, idx) => {
        form.setValue(`new_values.${idx}.id`, item.id);
        form.setValue(`new_values.${idx}.value`, item.value);
      });
    }
  };

  const handleRankingDragEnd = (event: DragEndEvent) => {
    setRankingActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRankingItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddValue = () => {
    append({ id: crypto.randomUUID(), value: "" });
    setTabStatuses((prev) => ({
      ...prev,
      valuesStatus: "in-progress",
    }));
  };

  const handleContinue = form.handleSubmit((data) => {
    const newValues = data.new_values.filter((v) => v.value.trim() !== "");

    // Build ranking items: existing values + new values
    const existingValues: RankingItem[] = (attribute?.values ?? [])
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((pv) => ({
        id: pv.id,
        value: pv.name,
        isNew: false,
      }));

    const newRankingItems: RankingItem[] = newValues.map((nv) => ({
      id: nv.id,
      value: nv.value,
      isNew: true,
    }));

    setRankingItems([...existingValues, ...newRankingItems]);

    setTabStatuses({
      valuesStatus: "completed",
      organizeStatus: "in-progress",
    });
    setActiveTab("organize-ranking");
  });

  const handleTabChange = (value: string) => {
    const newTab = value as "values" | "organize-ranking";

    if (
      newTab === "organize-ranking" &&
      tabStatuses.valuesStatus !== "completed"
    ) {
      return;
    }

    setActiveTab(newTab);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const values = rankingItems.map((item, index) => {
        if (item.isNew) {
          return { name: item.value, rank: index + 1 };
        }
        return { id: item.id, rank: index + 1 };
      });

      await upsertValues({ values });

      toast.success(t("attributes.createPossibleValues.successToast"));
      handleSuccess(`/settings/attributes/${id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAttributeLoading || !attribute) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <ProgressTabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex size-full flex-col overflow-hidden"
        data-testid="attribute-create-possible-value-progress-tabs"
      >
        <RouteFocusModal.Header data-testid="attribute-create-possible-value-modal-header">
          <div className="-my-2 w-full border-l">
            <ProgressTabs.List
              className="justify-start-start flex w-full items-center"
              data-testid="attribute-create-possible-value-tabs-list"
            >
              <ProgressTabs.Trigger
                value="values"
                status={tabStatuses.valuesStatus}
                className="max-w-[200px] truncate"
                data-testid="attribute-create-possible-value-values-tab"
              >
                {t("attributes.createPossibleValues.tabs.values")}
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                value="organize-ranking"
                status={tabStatuses.organizeStatus}
                className="max-w-[200px] truncate"
                data-testid="attribute-create-possible-value-organize-tab"
              >
                {t("attributes.createPossibleValues.tabs.organizeRanking")}
              </ProgressTabs.Trigger>
            </ProgressTabs.List>
          </div>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body
          className="size-full overflow-hidden"
          data-testid="attribute-create-possible-value-modal-body"
        >
          <ProgressTabs.Content
            value="values"
            className="size-full overflow-y-auto"
          >
            <div className="flex flex-col items-center p-16">
              <div className="flex w-full max-w-[720px] flex-col gap-y-4">
                <div>
                  <RouteFocusModal.Title asChild>
                    <Heading data-testid="attribute-create-possible-value-heading">
                      {t("attributes.createPossibleValues.header")}
                    </Heading>
                  </RouteFocusModal.Title>
                  <RouteFocusModal.Description asChild>
                    <Text
                      size="small"
                      className="text-ui-fg-subtle mt-1"
                      data-testid="attribute-create-possible-value-subtitle"
                    >
                      {t("attributes.createPossibleValues.subtitle", {
                        name: attribute.name,
                      })}
                    </Text>
                  </RouteFocusModal.Description>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleValuesDragEnd}
                >
                  <SortableContext
                    items={fields.map((field) => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fields.map((field, index) => (
                      <SortableValueInput
                        key={field.id}
                        id={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handleAddValue}
                  data-testid="attribute-create-possible-value-add-button"
                >
                  {t("attributes.createPossibleValues.addValue")}
                </Button>
              </div>
            </div>
          </ProgressTabs.Content>

          <ProgressTabs.Content
            value="organize-ranking"
            className="size-full overflow-y-auto"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={({ active }) =>
                setRankingActiveId(active.id as string)
              }
              onDragEnd={handleRankingDragEnd}
            >
              <SortableContext
                items={rankingItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="list-none p-0 m-0">
                  {rankingItems.map((item, index) => (
                    <SortableRankingItem
                      key={item.id}
                      id={item.id}
                      value={item.value}
                      index={index}
                      isGhost={rankingActiveId === item.id}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </ProgressTabs.Content>
        </RouteFocusModal.Body>
      </ProgressTabs>

      <RouteFocusModal.Footer data-testid="attribute-create-possible-value-modal-footer">
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button
              size="small"
              variant="secondary"
              type="button"
              data-testid="attribute-create-possible-value-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          {activeTab === "values" ? (
            <Button
              size="small"
              type="button"
              onClick={handleContinue}
              data-testid="attribute-create-possible-value-continue-button"
            >
              {t("actions.continue")}
            </Button>
          ) : (
            <Button
              size="small"
              type="button"
              onClick={handleSave}
              isLoading={isSaving}
              data-testid="attribute-create-possible-value-save-button"
            >
              {t("actions.save")}
            </Button>
          )}
        </div>
      </RouteFocusModal.Footer>
    </FormProvider>
  );
};

export const AttributeCreatePossibleValue = () => {
  return (
    <RouteFocusModal data-testid="attribute-create-possible-value-modal">
      <AttributeCreatePossibleValueInner />
    </RouteFocusModal>
  );
};
