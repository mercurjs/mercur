import {
  Badge,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  clx,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { getTransactionState, getTransactionStateColor } from "../../../utils"
import { HttpTypes } from "@medusajs/types"
import { TransactionState, TransactionStepState } from "../../../types"

type WorkflowExecutionGeneralSectionProps = {
  execution: HttpTypes.AdminWorkflowExecution
}

export const WorkflowExecutionGeneralSection = ({
  execution,
}: WorkflowExecutionGeneralSectionProps) => {
  const { t } = useTranslation()

  const cleanId = execution.id.replace("wf_exec_", "")
  const translatedState = getTransactionState(
    t,
    execution.state as TransactionState
  )
  const stateColor = getTransactionStateColor(
    execution.state as TransactionState
  )

  return (
    <Container className="divide-y p-0" data-testid="workflow-execution-general-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="workflow-execution-general-section-header">
        <div className="flex items-center gap-x-0.5" data-testid="workflow-execution-general-section-id">
          <Heading data-testid="workflow-execution-general-section-heading">{cleanId}</Heading>
          <Copy content={cleanId} className="text-ui-fg-muted" data-testid="workflow-execution-general-section-copy" />
        </div>
        <StatusBadge color={stateColor} data-testid="workflow-execution-general-section-status-badge">{translatedState}</StatusBadge>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="workflow-execution-general-section-workflow-id-row">
        <Text size="small" leading="compact" weight="plus" data-testid="workflow-execution-general-section-workflow-id-label">
          {t("workflowExecutions.workflowIdLabel")}
        </Text>
        <Badge size="2xsmall" className="w-fit" data-testid="workflow-execution-general-section-workflow-id-value">
          {execution.workflow_id}
        </Badge>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="workflow-execution-general-section-transaction-id-row">
        <Text size="small" leading="compact" weight="plus" data-testid="workflow-execution-general-section-transaction-id-label">
          {t("workflowExecutions.transactionIdLabel")}
        </Text>
        <Badge size="2xsmall" className="w-fit" data-testid="workflow-execution-general-section-transaction-id-value">
          {execution.transaction_id}
        </Badge>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="workflow-execution-general-section-progress-row">
        <Text size="small" leading="compact" weight="plus" data-testid="workflow-execution-general-section-progress-label">
          {t("workflowExecutions.progressLabel")}
        </Text>
        <Progress steps={execution.execution?.steps} data-testid="workflow-execution-general-section-progress-value" />
      </div>
    </Container>
  )
}

const ROOT_PREFIX = "_root"

const Progress = ({
  steps,
  "data-testid": dataTestId,
}: {
  steps?: Record<string, HttpTypes.AdminWorkflowExecutionStep> | null
  "data-testid"?: string
}) => {
  const { t } = useTranslation()

  if (!steps) {
    return (
      <Text size="small" leading="compact" className="text-ui-fg-subtle" data-testid={dataTestId}>
        {t("workflowExecutions.stepsCompletedLabel", {
          completed: 0,
          total: 0,
        })}
      </Text>
    )
  }

  const actionableSteps = Object.values(steps).filter(
    (step) => step.id !== ROOT_PREFIX
  )

  const completedSteps = actionableSteps.filter(
    (step) => step.invoke.state === TransactionStepState.DONE
  )

  return (
    <div className="flex w-fit items-center gap-x-2" data-testid={dataTestId}>
      <div className="flex items-center gap-x-[3px]" data-testid={`${dataTestId}-steps`}>
        {actionableSteps.map((step) => (
          <div
            key={step.id}
            className={clx(
              "bg-ui-bg-switch-off shadow-details-switch-background h-3 w-1.5 rounded-full",
              {
                "bg-ui-fg-muted":
                  step.invoke.state === TransactionStepState.DONE,
              }
            )}
            data-testid={`${dataTestId}-step-${step.id}`}
          />
        ))}
      </div>
      <Text size="small" leading="compact" className="text-ui-fg-subtle" data-testid={`${dataTestId}-text`}>
        {t("workflowExecutions.stepsCompletedLabel", {
          completed: completedSteps.length,
          count: actionableSteps.length,
        })}
      </Text>
    </div>
  )
}
