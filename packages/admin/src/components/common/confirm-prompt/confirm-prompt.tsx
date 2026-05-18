import { Label, Prompt, Textarea } from "@medusajs/ui";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type ConfirmPromptProps = {
  /**
   * Whether the prompt is visible. Controlled — pair with `onOpenChange`.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Visual variant of the underlying `@medusajs/ui` Prompt.
   * Defaults to `confirmation`.
   */
  variant?: "confirmation" | "danger";
  title: string;
  description?: ReactNode;
  /**
   * When provided, a `<Textarea>` is rendered between the description and the
   * footer. The current value is forwarded to `onConfirm`. Omit this prop to
   * render a plain confirmation prompt with no input.
   */
  noteLabel?: string;
  noteOptional?: boolean;
  notePlaceholder?: string;
  /**
   * Initial note value. Reset to this whenever `open` transitions to `true`.
   */
  defaultNote?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /**
   * Disables the inputs and footer buttons, and blocks `onOpenChange` from
   * closing the dialog while a submit is in flight.
   */
  isLoading?: boolean;
  /**
   * Called when the user clicks Confirm. Receives the trimmed note (or
   * `undefined` when no note input is rendered or the field is empty).
   * The parent is responsible for closing the dialog once submission resolves.
   */
  onConfirm: (note: string | undefined) => void | Promise<void>;
};

/**
 * Reusable confirmation prompt with an optional note input. Mirrors Medusa's
 * `@medusajs/ui` `Prompt` shape — title, description, footer — with an
 * optional `<Textarea>` slotted between the description and the footer.
 *
 * Use for destructive or significant actions where the operator should be
 * able to attach a short note. For pure yes/no confirmations, prefer the
 * `usePrompt` hook from `@medusajs/ui`.
 */
export const ConfirmPrompt = ({
  open,
  onOpenChange,
  variant = "confirmation",
  title,
  description,
  noteLabel,
  noteOptional = false,
  notePlaceholder,
  defaultNote = "",
  cancelLabel,
  confirmLabel,
  isLoading = false,
  onConfirm,
}: ConfirmPromptProps) => {
  const { t } = useTranslation();
  const [note, setNote] = useState(defaultNote);

  useEffect(() => {
    if (open) {
      setNote(defaultNote);
    }
  }, [open, defaultNote]);

  const showNoteField = typeof noteLabel === "string";

  const handleOpenChange = (next: boolean) => {
    if (isLoading) {
      return;
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    const trimmed = note.trim();
    await onConfirm(showNoteField && trimmed ? trimmed : undefined);
  };

  return (
    <Prompt open={open} onOpenChange={handleOpenChange} variant={variant}>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>{title}</Prompt.Title>
          {description ? (
            <Prompt.Description>{description}</Prompt.Description>
          ) : null}
        </Prompt.Header>

        {showNoteField ? (
          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Label size="small" weight="plus">
              {noteLabel}
              {noteOptional ? (
                <span className="text-ui-fg-muted ml-1 font-normal">
                  ({t("fields.optional")})
                </span>
              ) : null}
            </Label>
            <Textarea
              placeholder={notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
            />
          </div>
        ) : null}

        <Prompt.Footer>
          <Prompt.Cancel disabled={isLoading}>
            {cancelLabel ?? t("actions.cancel")}
          </Prompt.Cancel>
          <Prompt.Action
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isLoading}
          >
            {confirmLabel ?? t("actions.confirm")}
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
