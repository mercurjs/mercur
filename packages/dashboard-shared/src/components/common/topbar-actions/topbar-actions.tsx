import { Button, Popover, Text, Textarea, clx, toast } from "@medusajs/ui"
import { FormEvent, useState } from "react"
import { useTranslation } from "react-i18next"

export type FeedbackSubmitHandler = (message: string) => Promise<void> | void

type TopbarActionsProps = {
  version: string
  onSubmitFeedback: FeedbackSubmitHandler
  className?: string
}

export const TopbarActions = ({
  version,
  onSubmitFeedback,
  className,
}: TopbarActionsProps) => {
  const { t } = useTranslation()

  return (
    <div className={clx("flex items-center gap-x-2", className)}>
      <Text
        size="xsmall"
        leading="compact"
        className="text-ui-fg-muted me-1"
        data-testid="topbar-version"
      >
        {t("app.topbar.version", { version })}
      </Text>
      <FeedbackPopover onSubmit={onSubmitFeedback} />
    </div>
  )
}

const FeedbackPopover = ({ onSubmit }: { onSubmit: FeedbackSubmitHandler }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = message.trim()
    if (!trimmed) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
      toast.success(t("app.topbar.feedback.successToast"))
      setMessage("")
      setOpen(false)
    } catch {
      toast.error(t("app.topbar.feedback.errorToast"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button size="small" variant="secondary" data-testid="topbar-feedback">
          {t("app.topbar.feedback.label")}
        </Button>
      </Popover.Trigger>
      <Popover.Content
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="w-[360px] p-3"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <Textarea
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("app.topbar.feedback.placeholder")}
            data-testid="topbar-feedback-textarea"
          />
          <div className="flex justify-end">
            <Button
              size="small"
              type="submit"
              disabled={!message.trim()}
              isLoading={isSubmitting}
              data-testid="topbar-feedback-submit"
            >
              {t("app.topbar.feedback.submit")}
            </Button>
          </div>
        </form>
      </Popover.Content>
    </Popover>
  )
}
