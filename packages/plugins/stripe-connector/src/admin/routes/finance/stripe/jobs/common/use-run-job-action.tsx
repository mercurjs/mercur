import { toast, usePrompt } from "@medusajs/ui"

import { useRunStripeJob } from "../../../../../hooks/api/stripe"
import { JOB_LABEL } from "../../../../../lib/status"

export const useRunJobAction = (job: string) => {
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useRunStripeJob(job)
  const label = JOB_LABEL[job] ?? job

  const handleRun = async () => {
    const confirmed = await prompt({
      title: `Run ${label.toLowerCase()} now?`,
      description: "The job runs immediately, outside of its schedule, and moves its checkpoint forward.",
      confirmText: "Run",
      cancelText: "Cancel",
      variant: "confirmation",
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: ({ run }) =>
        run.status === "failed"
          ? toast.error(`${label} failed`, { description: run.error ?? undefined })
          : toast.success(`${label} finished`),
      onError: (error) => toast.error(error.message),
    })
  }

  return { handleRun, isPending }
}
