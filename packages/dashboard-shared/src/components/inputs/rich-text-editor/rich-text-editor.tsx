import { clx, toast } from "@medusajs/ui"
import { Image } from "@tiptap/extension-image"
import { Placeholder } from "@tiptap/extensions"
import { EditorContent, useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import {
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

import { normalizeRichText, plainTextToHtml } from "../../../lib/rich-text"
import { richTextContentClasses } from "../../common/rich-text/rich-text-content-classes"
import { RichTextToolbar } from "./rich-text-toolbar"

export type RichTextEditorProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "onBlur" | "defaultValue"
> & {
  value?: string | null
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  disabled?: boolean
  placeholder?: string
  onUpload?: (file: File) => Promise<string>
  contentClassName?: string
}

const getImageFiles = (files?: FileList | null) =>
  Array.from(files ?? []).filter((file) => file.type.startsWith("image/"))

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      disabled,
      placeholder,
      onUpload,
      className,
      contentClassName,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation()
    const [isUploading, setIsUploading] = useState(false)

    const lastEmitted = useRef<string>(normalizeRichText(value))
    const onChangeRef = useRef(onChange)
    const onBlurRef = useRef(onBlur)
    const uploadImagesRef = useRef<(files: File[]) => void>(() => {})

    onChangeRef.current = onChange
    onBlurRef.current = onBlur

    const editor = useEditor({
      editable: !disabled,
      shouldRerenderOnTransaction: true,
      content: plainTextToHtml(value),
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          horizontalRule: false,
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
            protocols: ["http", "https", "mailto"],
            HTMLAttributes: {
              rel: "noopener noreferrer nofollow",
              target: "_blank",
            },
          },
        }),
        Image.configure({ allowBase64: false }),
        Placeholder.configure({ placeholder: placeholder ?? "" }),
      ],
      editorProps: {
        attributes: {
          class: clx(
            richTextContentClasses,
            "text-ui-fg-base min-h-[120px] px-3 py-2 outline-none",
            contentClassName
          ),
          ...(name ? { "data-name": name } : {}),
        },
        handlePaste: (_view, event) => {
          const files = getImageFiles(event.clipboardData?.files)

          if (!files.length || !onUpload) {
            return false
          }

          uploadImagesRef.current(files)
          return true
        },
        handleDrop: (_view, event, _slice, moved) => {
          if (moved) {
            return false
          }

          const files = getImageFiles(event.dataTransfer?.files)

          if (!files.length || !onUpload) {
            return false
          }

          event.preventDefault()
          uploadImagesRef.current(files)
          return true
        },
      },
      onUpdate: ({ editor: instance }) => {
        const html = normalizeRichText(instance.getHTML())
        lastEmitted.current = html
        onChangeRef.current?.(html)
      },
      onBlur: () => {
        onBlurRef.current?.()
      },
    })

    const uploadImages = useCallback(
      async (files: File[]) => {
        if (!editor || !onUpload) {
          return
        }

        setIsUploading(true)

        try {
          const sources = await Promise.all(files.map(onUpload))

          sources.forEach((src, index) => {
            editor
              .chain()
              .focus()
              .setImage({ src, alt: files[index].name })
              .run()
          })
        } catch {
          toast.error(t("richTextEditor.imageUploadFailed"))
        } finally {
          setIsUploading(false)
        }
      },
      [editor, onUpload, t]
    )

    uploadImagesRef.current = uploadImages

    useEffect(() => {
      editor?.setEditable(!disabled)
    }, [editor, disabled])

    useEffect(() => {
      if (!editor) {
        return
      }

      const next = normalizeRichText(value)

      if (next === lastEmitted.current) {
        return
      }

      lastEmitted.current = next
      editor.commands.setContent(plainTextToHtml(next), { emitUpdate: false })
    }, [editor, value])

    return (
      <div
        ref={ref}
        className={clx(
          "bg-ui-bg-field shadow-borders-base flex w-full flex-col overflow-hidden rounded-md",
          "transition-fg focus-within:shadow-borders-interactive-with-active",
          "aria-[invalid=true]:shadow-borders-error",
          "[&_.is-editor-empty:first-child]:before:text-ui-fg-muted [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_img.ProseMirror-selectednode]:shadow-borders-interactive-with-focus",
          {
            "bg-ui-bg-disabled text-ui-fg-disabled cursor-not-allowed":
              disabled,
          },
          className
        )}
        {...props}
      >
        {editor && (
          <RichTextToolbar
            editor={editor}
            disabled={disabled}
            canUpload={!!onUpload}
            isUploading={isUploading}
            onPickImages={uploadImages}
          />
        )}
        <EditorContent editor={editor} />
      </div>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"
