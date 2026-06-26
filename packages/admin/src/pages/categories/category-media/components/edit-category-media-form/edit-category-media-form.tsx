import { Fragment, useCallback, useState } from "react"

import { ThumbnailBadge } from "@medusajs/icons"
import { ListBadge } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Checkbox,
  CommandBar,
  Text,
  Tooltip,
  clx,
  toast,
} from "@medusajs/ui"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { z } from "zod"

import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { Form } from "../../../../../components/common/form"
import { RouteFocusModal, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductCategory } from "../../../../../hooks/api/categories"
import {
  CATEGORY_IMAGE_FORMATS,
  CategoryWithImages,
  getCategoryGallery,
  uploadCategoryImages,
} from "../../../common/components/category-image-fields"

const MediaSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  file: z.any().nullable(), // File
  is_thumbnail: z.boolean(),
  is_banner: z.boolean(),
})

const EditCategoryMediaSchema = z.object({
  media: z.array(MediaSchema),
})

type EditCategoryMediaSchemaType = z.infer<typeof EditCategoryMediaSchema>
type MediaField = EditCategoryMediaSchemaType["media"][number] & {
  field_id: string
}

type EditCategoryMediaFormProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

export const EditCategoryMediaForm = ({
  category,
}: EditCategoryMediaFormProps) => {
  const [selection, setSelection] = useState<Record<string, true>>({})
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<EditCategoryMediaSchemaType>({
    defaultValues: {
      media: getCategoryGallery(category.media_images).map((image) => ({
        id: image.id,
        url: image.url,
        file: null,
        is_thumbnail: image.is_thumbnail,
        is_banner: image.is_banner,
      })),
    },
    resolver: zodResolver(EditCategoryMediaSchema),
  })

  const { fields, append, remove, update } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  })

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((item) => item.field_id === active.id)
      const newIndex = fields.findIndex((item) => item.field_id === over?.id)
      form.setValue("media", arrayMove(fields, oldIndex, newIndex), {
        shouldDirty: true,
        shouldTouch: true,
      })
    }
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id)
  const handleDragCancel = () => setActiveId(null)

  const { mutateAsync, isPending } = useUpdateProductCategory(category.id)

  const handleSubmit = form.handleSubmit(async ({ media }) => {
    const images = await uploadCategoryImages({
      media: media.map((m) => ({
        url: m.url,
        file: m.file,
        is_thumbnail: m.is_thumbnail,
        is_banner: m.is_banner,
      })),
    })

    await mutateAsync(images, {
      onSuccess: () => {
        toast.success(t("categories.media.edit.successToast"))
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  const handleCheckedChange = useCallback(
    (id: string) => (val: boolean) => {
      if (!val) {
        const { [id]: _, ...rest } = selection
        setSelection(rest)
      } else {
        setSelection((prev) => ({ ...prev, [id]: true }))
      }
    },
    [selection]
  )

  const handleDelete = () => {
    const ids = Object.keys(selection)
    const indices = ids.map((id) => fields.findIndex((m) => m.field_id === id))
    remove(indices)
    setSelection({})
  }

  const handlePromote = (role: "is_thumbnail" | "is_banner") => {
    const ids = Object.keys(selection)
    if (!ids.length) {
      return
    }
    const targetIndex = fields.findIndex((m) => m.field_id === ids[0])
    fields.forEach((field, i) => {
      const shouldBe = i === targetIndex
      if (field[role] !== shouldBe) {
        update(i, { ...field, [role]: shouldBe })
      }
    })
    setSelection({})
  }

  const onUploaded = (files: FileType[]) => {
    files.forEach((f) =>
      append({
        url: f.url,
        file: f.file,
        is_thumbnail: false,
        is_banner: false,
      })
    )
  }

  const selectionCount = Object.keys(selection).length

  return (
    <RouteFocusModal.Form blockSearchParams form={form}>
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            <Button variant="secondary" size="small" asChild>
              <Link to={{ pathname: ".", search: undefined }}>
                {t("categories.media.galleryLabel")}
              </Link>
            </Button>
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <div className="flex size-full flex-col-reverse lg:grid lg:grid-cols-[1fr_560px]">
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
            >
              <div className="bg-ui-bg-subtle size-full overflow-auto">
                <div className="grid h-fit auto-rows-auto grid-cols-4 gap-6 p-6">
                  <SortableContext
                    items={fields.map((m) => m.field_id)}
                    strategy={rectSortingStrategy}
                  >
                    {fields.map((m) => (
                      <MediaGridItem
                        key={m.field_id}
                        media={m}
                        checked={!!selection[m.field_id]}
                        onCheckedChange={handleCheckedChange(m.field_id)}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId ? (
                      <MediaGridItemOverlay
                        media={fields.find((m) => m.field_id === activeId)!}
                      />
                    ) : null}
                  </DragOverlay>
                </div>
              </div>
            </DndContext>
            <div className="bg-ui-bg-base overflow-auto border-b px-6 py-4 lg:border-b-0 lg:border-l">
              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-1">
                  <Text size="small" weight="plus" leading="compact">
                    {t("categories.media.label")}
                  </Text>
                  <Form.Hint>{t("categories.media.editHint")}</Form.Hint>
                </div>
                <FileUpload
                  label={t("categories.media.upload.title")}
                  hint={t("categories.media.upload.hint")}
                  formats={CATEGORY_IMAGE_FORMATS}
                  onUploaded={onUploaded}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <CommandBar open={!!selectionCount}>
          <CommandBar.Bar>
            <CommandBar.Value>
              {t("general.countSelected", { count: selectionCount })}
            </CommandBar.Value>
            <CommandBar.Seperator />
            {selectionCount === 1 && (
              <Fragment>
                <CommandBar.Command
                  action={() => handlePromote("is_thumbnail")}
                  label={t("categories.media.actions.setThumbnail")}
                  shortcut="t"
                />
                <CommandBar.Seperator />
                <CommandBar.Command
                  action={() => handlePromote("is_banner")}
                  label={t("categories.media.actions.setBanner")}
                  shortcut="b"
                />
                <CommandBar.Seperator />
              </Fragment>
            )}
            <CommandBar.Command
              action={handleDelete}
              label={t("actions.delete")}
              shortcut="d"
            />
          </CommandBar.Bar>
        </CommandBar>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
}

const RoleBadges = ({ media }: { media: MediaField }) => {
  const { t } = useTranslation()
  if (!media.is_thumbnail && !media.is_banner) {
    return null
  }
  return (
    <div className="absolute left-2 top-2 flex items-center gap-x-1">
      {media.is_thumbnail && (
        <Tooltip content={t("categories.media.thumbnail")}>
          <ThumbnailBadge />
        </Tooltip>
      )}
      {media.is_banner && (
        <Tooltip content={t("categories.media.banner")}>
          <ListBadge />
        </Tooltip>
      )}
    </div>
  )
}

type MediaGridItemProps = {
  media: MediaField
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

const MediaGridItem = ({
  media,
  checked,
  onCheckedChange,
}: MediaGridItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.field_id })

  const style = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      className="group bg-ui-bg-subtle-hover shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus relative aspect-square h-auto max-w-full overflow-hidden rounded-lg outline-none"
      style={style}
      ref={setNodeRef}
    >
      <RoleBadges media={media} />
      <div
        className={clx("absolute inset-0 cursor-grab touch-none outline-none", {
          "cursor-grabbing": isDragging,
        })}
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
      />
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100":
            !isDragging && !checked,
          "opacity-100": checked,
        })}
      >
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </div>
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}

const MediaGridItemOverlay = ({ media }: { media: MediaField }) => {
  return (
    <div className="group bg-ui-bg-subtle-hover shadow-elevation-card-rest relative aspect-square h-auto max-w-full cursor-grabbing overflow-hidden rounded-lg outline-none">
      <RoleBadges media={media} />
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}
