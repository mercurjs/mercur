export enum PayoutWorkflowEvents {
  FAILED = 'payout.failed',
  SUCCEEDED = 'payout.succeeded',
  RECEIVED = 'payout.received'
}

export enum PayoutWebhookEvents {
  ACCOUNT_WEBHOOK_RECEIVED = 'payout_account.webhook_received'
}

export enum PayoutWebhookAction {
  ACCOUNT_AUTHORIZED = 'account_authorized',
  ACCOUNT_DEAUTHORIZED = 'account_deauthorized',
  ACCOUNT_REQUIRES_ACTION = 'account_requires_action'
}
