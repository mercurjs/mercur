export type StepSubmission = Record<string, unknown> & {
  additional_data?: Record<string, unknown>;
};

export type StepProps<TValues extends StepSubmission = StepSubmission> = {
  onSubmit: (data: TValues) => Promise<void>;
  /** Set when the step is optional; renders the Skip button. */
  onSkip?: () => void;
  isLast: boolean;
  isPending?: boolean;
};
