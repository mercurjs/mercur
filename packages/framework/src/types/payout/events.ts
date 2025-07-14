/**
 * *
 * @enum Payout workflow events
 */
export enum PayoutWorkflowEvents {
  /**
 * *
 * The payout failed event.
 * 
 * @defaultValue "payout.failed"

 */
  FAILED = "payout.failed",
  /**
 * *
 * The payout succeeded event.
 * 
 * @defaultValue "payout.succeeded"

 */
  SUCCEEDED = "payout.succeeded",
  /**
 * *
 * The payout received event.
 * 
 * @defaultValue "payout.received"

 */
  RECEIVED = "payout.received",
}

/**
 * *
 * @enum
 *
 * The payout account webhooks event.
 */
export enum PayoutWebhookEvents {
  /**
 * *
 * The payout account webhook received event.
 * 
 * @defaultValue "payout_account.webhook_received"

 */
  ACCOUNT_WEBHOOK_RECEIVED = "payout_account.webhook_received",
}

/**
 * *
 * @enum Payout events
 */
export enum PayoutWebhookAction {
  /**
 * *
 * The payout account authorized event.
 * 
 * @defaultValue "account_authorized"

 */
  ACCOUNT_AUTHORIZED = "account_authorized",
  /**
 * *
 * The payout account deauthorized event.
 * 
 * @defaultValue "account_deauthorized"

 */
  ACCOUNT_DEAUTHORIZED = "account_deauthorized",
  /**
 * *
 * The payout account requires action event.
 * 
 * @defaultValue "account_requires_action"

 */
  ACCOUNT_REQUIRES_ACTION = "account_requires_action",
}

/**
 * *
 * @enum Payout summary events
 */
export enum PayoutSummaryEvents {
  /**
 * *
 * The payout notification sent event.
 * 
 * @defaultValue "payout.notification_sent"

 */
  NOTIFICATION_SENT = "payout.notification_sent",
}
