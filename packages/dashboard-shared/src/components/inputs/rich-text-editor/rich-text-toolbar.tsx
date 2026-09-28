import {
  ArrowUturnLeft,
  Link as LinkIcon,
  ListBullet,
  Photo,
  TrianglesMini,
} from "@medusajs/icons"
import {
  Button,
  DropdownMenu,
  IconButton,
  Input,
  Tooltip,
  clx,
} from "@medusajs/ui"
import { Editor } from "@tiptap/react"
import { Popover as RadixPopover } from "radix-ui"
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

type ToolbarButtonProps = {
  label: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  "data-testid"?: string
}

const ToolbarButton = ({
  label,
  isActive,
  disabled,
  onClick,
  children,
  "data-testid": dataTestId,
}: ToolbarButtonProps) => (
  <Tooltip content={label}>
    <IconButton
      type="button"
      size="small"
      variant="transparent"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clx("text-ui-fg-muted", {
        "bg-ui-bg-base-pressed text-ui-fg-base": isActive,
      })}
      data-testid={dataTestId}
    >
      {children}
    </IconButton>
  </Tooltip>
)

const Glyph = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <span
    className={clx("txt-compact-small-plus w-[15px] text-center", className)}
  >
    {children}
  </span>
)

const Divider = () => <div className="bg-ui-border-base mx-1 h-4 w-px" />

type HeadingLevel = 2 | 3

const HeadingMenu = ({
  editor,
  disabled,
}: {
  editor: Editor
  disabled?: boolean
}) => {
  const { t } = useTranslation()

  const active: HeadingLevel | null = editor.isActive("heading", { level: 2 })
    ? 2
    : editor.isActive("heading", { level: 3 })
      ? 3
      : null

  const label = active
    ? t(`richTextEditor.heading${active}`)
    : t("richTextEditor.paragraph")

  const setHeading = (level: HeadingLevel | null) => {
    const chain = editor.chain().focus()

    if (level) {
      chain.setHeading({ level }).run()
    } else {
      chain.setParagraph().run()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <Button
          type="button"
          size="small"
          variant="transparent"
          className="text-ui-fg-subtle gap-x-1 px-2"
          data-testid="rich-text-editor-heading-trigger"
        >
          {label}
          <TrianglesMini className="text-ui-fg-muted" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        <DropdownMenu.Item onClick={() => setHeading(null)}>
          {t("richTextEditor.paragraph")}
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setHeading(2)}>
          <span className="txt-compact-medium-plus">
            {t("richTextEditor.heading2")}
          </span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setHeading(3)}>
          <span className="txt-compact-small-plus">
            {t("richTextEditor.heading3")}
          </span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (/^(https?:|mailto:)/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

const LinkPopover = ({
  editor,
  disabled,
}: {
  editor: Editor
  disabled?: boolean
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  const isActive = editor.isActive("link")

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setUrl(editor.getAttributes("link").href ?? "")
    }

    setOpen(next)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const href = normalizeUrl(url)
    const chain = editor.chain().focus().extendMarkRange("link")

    if (href) {
      chain.setLink({ href }).run()
    } else {
      chain.unsetLink().run()
    }

    setOpen(false)
  }

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setOpen(false)
  }

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger asChild disabled={disabled}>
        <IconButton
          type="button"
          size="small"
          variant="transparent"
          aria-label={t("richTextEditor.link")}
          aria-pressed={isActive}
          onMouseDown={(e) => e.preventDefault()}
          className={clx("text-ui-fg-muted", {
            "bg-ui-bg-base-pressed text-ui-fg-base": isActive,
          })}
          data-testid="rich-text-editor-link-button"
        >
          <LinkIcon />
        </IconButton>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align="start"
          sideOffset={8}
          collisionPadding={24}
          className="bg-ui-bg-base shadow-elevation-flyout z-50 w-[320px] rounded-lg p-3"
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-y-2"
          >
            <Input
              size="small"
              value={url}
              placeholder={t("richTextEditor.linkPlaceholder")}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="rich-text-editor-link-input"
            />
            <div className="flex items-center justify-end gap-x-2">
              {isActive && (
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={handleRemove}
                  data-testid="rich-text-editor-link-remove"
                >
                  {t("richTextEditor.removeLink")}
                </Button>
              )}
              <Button
                type="submit"
                size="small"
                data-testid="rich-text-editor-link-save"
              >
                {t("actions.save")}
              </Button>
            </div>
          </form>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

const ImageButton = ({
  onPick,
  disabled,
  isUploading,
}: {
  onPick: (files: File[]) => void
  disabled?: boolean
  isUploading?: boolean
}) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""

    if (files.length) {
      onPick(files)
    }
  }

  return (
    <>
      <ToolbarButton
        label={
          isUploading
            ? t("richTextEditor.uploadingImage")
            : t("richTextEditor.image")
        }
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        data-testid="rich-text-editor-image-button"
      >
        <Photo className={clx({ "animate-pulse": isUploading })} />
      </ToolbarButton>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label={t("richTextEditor.image")}
        onChange={handleChange}
        data-testid="rich-text-editor-image-input"
      />
    </>
  )
}

type RichTextToolbarProps = {
  editor: Editor
  disabled?: boolean
  canUpload: boolean
  isUploading: boolean
  onPickImages: (files: File[]) => void
}

export const RichTextToolbar = ({
  editor,
  disabled,
  canUpload,
  isUploading,
  onPickImages,
}: RichTextToolbarProps) => {
  const { t } = useTranslation()

  const chain = () => editor.chain().focus()

  return (
    <div
      className="border-ui-border-base flex flex-wrap items-center gap-0.5 border-b p-1"
      role="toolbar"
      data-testid="rich-text-editor-toolbar"
    >
      <HeadingMenu editor={editor} disabled={disabled} />
      <Divider />
      <ToolbarButton
        label={t("richTextEditor.bold")}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
        data-testid="rich-text-editor-bold-button"
      >
        <Glyph className="font-bold">B</Glyph>
      </ToolbarButton>
      <ToolbarButton
        label={t("richTextEditor.italic")}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
        data-testid="rich-text-editor-italic-button"
      >
        <Glyph className="font-serif italic">I</Glyph>
      </ToolbarButton>
      <ToolbarButton
        label={t("richTextEditor.underline")}
        isActive={editor.isActive("underline")}
        disabled={disabled}
        onClick={() => chain().toggleUnderline().run()}
        data-testid="rich-text-editor-underline-button"
      >
        <Glyph className="underline">U</Glyph>
      </ToolbarButton>
      <ToolbarButton
        label={t("richTextEditor.strike")}
        isActive={editor.isActive("strike")}
        disabled={disabled}
        onClick={() => chain().toggleStrike().run()}
        data-testid="rich-text-editor-strike-button"
      >
        <Glyph className="line-through">S</Glyph>
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label={t("richTextEditor.bulletList")}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
        data-testid="rich-text-editor-bullet-list-button"
      >
        <ListBullet />
      </ToolbarButton>
      <ToolbarButton
        label={t("richTextEditor.orderedList")}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => chain().toggleOrderedList().run()}
        data-testid="rich-text-editor-ordered-list-button"
      >
        <Glyph>1.</Glyph>
      </ToolbarButton>
      <ToolbarButton
        label={t("richTextEditor.blockquote")}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={() => chain().toggleBlockquote().run()}
        data-testid="rich-text-editor-blockquote-button"
      >
        <Glyph className="font-serif">”</Glyph>
      </ToolbarButton>
      <Divider />
      <LinkPopover editor={editor} disabled={disabled} />
      {canUpload && (
        <ImageButton
          onPick={onPickImages}
          disabled={disabled}
          isUploading={isUploading}
        />
      )}
      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          label={t("richTextEditor.undo")}
          disabled={disabled || !editor.can().undo()}
          onClick={() => chain().undo().run()}
          data-testid="rich-text-editor-undo-button"
        >
          <ArrowUturnLeft />
        </ToolbarButton>
        <ToolbarButton
          label={t("richTextEditor.redo")}
          disabled={disabled || !editor.can().redo()}
          onClick={() => chain().redo().run()}
          data-testid="rich-text-editor-redo-button"
        >
          <ArrowUturnLeft className="-scale-x-100" />
        </ToolbarButton>
      </div>
    </div>
  )
}
