import { ArrowPath } from "@medusajs/icons"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"
import { Link } from "react-router-dom"

import { useRunStripeJob, useStripeJobs } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import { JOB_DESCRIPTION, JOB_LABEL, formatDate } from "../../../../lib/status"

export const JobCard = ({ job, runBody }: { job: string; runBody?: Record<string, string> }) => {
  const { data, isPending } = useStripeJobs()
  const run = useRunStripeJob()
  const blocker = useActionBlocker("payouts", "edit")
  const info = data?.jobs.find((j) => j.job === job)
  const last = info?.last_run

  return (
    <Container className="divide-y p-0" data-testid={`stripe-job-${job}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{JOB_LABEL[job] ?? job}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {JOB_DESCRIPTION[job]}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          {info ? (
            info.enabled ? (
              <StatusBadge color="green">Enabled</StatusBadge>
            ) : (
              <StatusBadge color="grey">Disabled</StatusBadge>
            )
          ) : null}
          <Button size="small" variant="secondary" asChild>
            <Link to={`/finance/stripe/runs/${job}`}>History</Link>
          </Button>
          <Button
            size="small"
            variant="secondary"
            isLoading={run.isPending}
            disabled={blocker.disabled || isPending}
            onClick={() =>
              run.mutate(
                { job, body: runBody },
                {
                  onSuccess: () => toast.success("Run finished", { description: `${JOB_LABEL[job]} ran now.` }),
                  onError: (error) => toast.error(error.message),
                }
              )
            }
            data-testid={`stripe-job-${job}-run`}
          >
            <ArrowPath />
            Run now
          </Button>
        </div>
      </div>
      <SectionRow title="Schedule (UTC)" value={<code className="txt-compact-small">{info?.schedule ?? "-"}</code>} />
      <SectionRow title="Checkpoint" value={info?.checkpoint ? formatDate(info.checkpoint) : "None yet"} />
      <SectionRow
        title="Last run"
        value={
          last ? (
            <span className="flex items-center gap-x-2">
              <StatusBadge color={last.status === "succeeded" ? "green" : last.status === "failed" ? "red" : "blue"}>
                {last.status}
              </StatusBadge>
              <span>
                {formatDate(last.started_at)} · {last.trigger}
                {last.stats ? ` · ${Object.entries(last.stats).map(([k, v]) => `${k} ${v}`).join(", ")}` : ""}
                {last.error ? ` · ${last.error}` : ""}
              </span>
            </span>
          ) : (
            "Never"
          )
        }
      />
      <SectionRow title="Next run" value={info?.next_run_at ? formatDate(info.next_run_at) : "Not scheduled"} />
    </Container>
  )
}
