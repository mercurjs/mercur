import { useEffect, useRef, useState } from "react"

import { Plus } from "@medusajs/icons"
import { Controller, ControllerRenderProps } from "react-hook-form"

import { Thumbnail } from "../../common/thumbnail"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

export type MediaData = {
  id?: string
  url: string
  isThumbnail: boolean
  file?: File | null
}

export const DataGridMediaCell = <TData, TValue = MediaData[]>({
  context,
  onOpenMediaModal,
  disabled,
  ...rest
}: DataGridCellProps<TData, TValue> & {
  onOpenMediaModal?: () => void
  disabled?: boolean
}) => {
  const { field, control, renderProps } = useDataGridCell({
    context,
  })
  const errorProps = useDataGridCellError({ context })

  const { container, input } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field }) => {
        return (
          <DataGridCellContainer
            {...container}
            {...errorProps}
            outerComponent={
              <OuterComponent
                isAnchor={container.isAnchor}
                onOpenMediaModal={onOpenMediaModal}
                disabled={disabled}
              />
            }
          >
            <Inner
              field={field}
              inputProps={input}
              disabled={disabled}
              {...rest}
            />
          </DataGridCellContainer>
        )
      }}
    />
  )
}

const OuterComponent = ({
  isAnchor,
  onOpenMediaModal,
  disabled,
}: {
  isAnchor: boolean
  onOpenMediaModal?: () => void
  disabled?: boolean
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isAnchor &&
        e.key === "Enter" &&
        onOpenMediaModal &&
        !disabled
      ) {
        e.preventDefault()
        onOpenMediaModal()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isAnchor, onOpenMediaModal, disabled])

  return (
    <div className="absolute inset-y-0 right-4 z-[3] flex w-fit items-center justify-center opacity-0 transition-opacity group-hover/container:opacity-100">
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpenMediaModal}
        className="txt-compact-small-plus flex items-center justify-center rounded-[4px] p-1 text-ui-fg-interactive outline-none transition-fg hover:text-ui-fg-interactive-hover focus-visible:shadow-borders-focus disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!onOpenMediaModal || disabled}
      >
        <Plus
          className={disabled ? "text-ui-fg-muted" : undefined}
        />
      </button>
    </div>
  )
}

const Inner = ({
  field,
  inputProps,
  disabled,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  disabled?: boolean
}) => {
  const { ref, value, onChange: _, onBlur, ...fieldProps } = field
  const {
    ref: inputRef,
    onChange,
    onBlur: onInputBlur,
    onFocus,
  } = inputProps

  const [localValue, setLocalValue] = useState<MediaData[]>(value || [])

  useEffect(() => {
    setLocalValue(value || [])
  }, [value])

  const combinedRef = useCombinedRefs(inputRef, ref)

  const handleOnChange = () => {
    onChange(localValue, value)
  }

  const hasMedia = localValue && localValue.length > 0
  const MAX_VISIBLE_THUMBNAILS = 4

  return (
    <div
      className={`flex size-full items-center gap-x-2 ${disabled ? "opacity-50" : ""}`}
      {...fieldProps}
    >
      <div
        ref={combinedRef}
        className={`flex h-full flex-1 items-center gap-1.5 overflow-hidden py-2.5 ${disabled ? "cursor-not-allowed" : "cursor-default"}`}
        onFocus={disabled ? undefined : onFocus}
        onBlur={
          disabled
            ? undefined
            : () => {
                onBlur()
                onInputBlur()
                handleOnChange()
              }
        }
        tabIndex={disabled ? -1 : -1}
      >
        {hasMedia ? (
          <>
            {localValue
              .slice(0, MAX_VISIBLE_THUMBNAILS)
              .map((media, index) => (
                <div
                  key={media.id || `media-${index}`}
                  className="shrink-0"
                >
                  <Thumbnail
                    src={media.url}
                    alt={
                      media.url
                        ? `Product image ${index + 1}`
                        : undefined
                    }
                    size="small"
                  />
                </div>
              ))}
            {localValue.length > MAX_VISIBLE_THUMBNAILS && (
              <div className="flex h-5 w-4 shrink-0 items-center justify-center rounded border border-ui-border-base bg-ui-bg-component text-[10px] font-medium text-ui-fg-subtle">
                +{localValue.length - MAX_VISIBLE_THUMBNAILS}
              </div>
            )}
          </>
        ) : (
          <Thumbnail size="small" />
        )}
      </div>
    </div>
  )
}

function useCombinedRefs<T extends HTMLElement>(
  ...refs: React.Ref<T>[]
): React.Ref<T> {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}
