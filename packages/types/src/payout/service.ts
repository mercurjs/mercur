import {
  BaseFilterable,
  Context,
  FindConfig,
  IModuleService,
  OperatorMap,
} from "@medusajs/types"

import {
  OnboardingDTO,
  PayoutAccountDTO,
  PayoutAccountStatus,
  PayoutDTO,
  PayoutKycStatus,
  PayoutReversalDTO,
  PayoutStatus,
  ResolvedPayoutModuleOptions,
} from "./common"
import {
  CreateOnboardingDTO,
  CreatePayoutAccountDTO,
  CreatePayoutDTO,
  CreatePayoutReversalDTO,
  UpdatePayoutAccountDTO,
  UpdatePayoutDTO,
  UpdatePayoutReversalDTO,
} from "./mutations"
import { PayoutWebhookActionInput, PayoutWebhookResult } from "./provider"

export interface FilterablePayoutAccountProps
  extends BaseFilterable<FilterablePayoutAccountProps> {
  id?: string | string[]
  external_id?: string | string[]
  status?: PayoutAccountStatus | PayoutAccountStatus[]
  kyc_status?: PayoutKycStatus | PayoutKycStatus[]
  payouts_enabled?: boolean
  onboarding_token?: string
  created_at?: OperatorMap<string>
  updated_at?: OperatorMap<string>
}

export interface FilterableOnboardingProps
  extends BaseFilterable<FilterableOnboardingProps> {
  id?: string | string[]
  account_id?: string | string[]
}

export interface FilterablePayoutProps
  extends BaseFilterable<FilterablePayoutProps> {
  id?: string | string[]
  account_id?: string | string[]
  order_id?: string | string[]
  status?: PayoutStatus | PayoutStatus[]
  created_at?: OperatorMap<string>
  updated_at?: OperatorMap<string>
}

export interface FilterablePayoutReversalProps
  extends BaseFilterable<FilterablePayoutReversalProps> {
  id?: string | string[]
  payout_id?: string | string[]
  refund_id?: string | string[]
  status?: PayoutStatus | PayoutStatus[]
  created_at?: OperatorMap<string>
  updated_at?: OperatorMap<string>
}

export interface IPayoutModuleService extends IModuleService {
  getOptions(): ResolvedPayoutModuleOptions

  retrievePayoutAccount(
    id: string,
    config?: FindConfig<PayoutAccountDTO>,
    sharedContext?: Context
  ): Promise<PayoutAccountDTO>
  listPayoutAccounts(
    filters?: FilterablePayoutAccountProps,
    config?: FindConfig<PayoutAccountDTO>,
    sharedContext?: Context
  ): Promise<PayoutAccountDTO[]>
  listAndCountPayoutAccounts(
    filters?: FilterablePayoutAccountProps,
    config?: FindConfig<PayoutAccountDTO>,
    sharedContext?: Context
  ): Promise<[PayoutAccountDTO[], number]>
  /**
   * Stores account rows without calling the provider, e.g. for an account
   * that already exists there. Use `createPayoutAccount` to open one.
   */
  createPayoutAccounts(
    data: Partial<PayoutAccountDTO>[],
    sharedContext?: Context
  ): Promise<PayoutAccountDTO[]>
  createPayoutAccounts(
    data: Partial<PayoutAccountDTO>,
    sharedContext?: Context
  ): Promise<PayoutAccountDTO>
  updatePayoutAccounts(
    data: UpdatePayoutAccountDTO[],
    sharedContext?: Context
  ): Promise<PayoutAccountDTO[]>
  updatePayoutAccounts(
    data: UpdatePayoutAccountDTO,
    sharedContext?: Context
  ): Promise<PayoutAccountDTO>
  deletePayoutAccounts(ids: string | string[], sharedContext?: Context): Promise<void>

  retrieveOnboarding(
    id: string,
    config?: FindConfig<OnboardingDTO>,
    sharedContext?: Context
  ): Promise<OnboardingDTO>
  listOnboardings(
    filters?: FilterableOnboardingProps,
    config?: FindConfig<OnboardingDTO>,
    sharedContext?: Context
  ): Promise<OnboardingDTO[]>

  retrievePayout(
    id: string,
    config?: FindConfig<PayoutDTO>,
    sharedContext?: Context
  ): Promise<PayoutDTO>
  listPayouts(
    filters?: FilterablePayoutProps,
    config?: FindConfig<PayoutDTO>,
    sharedContext?: Context
  ): Promise<PayoutDTO[]>
  listAndCountPayouts(
    filters?: FilterablePayoutProps,
    config?: FindConfig<PayoutDTO>,
    sharedContext?: Context
  ): Promise<[PayoutDTO[], number]>
  createPayouts(data: CreatePayoutDTO[], sharedContext?: Context): Promise<PayoutDTO[]>
  createPayouts(data: CreatePayoutDTO, sharedContext?: Context): Promise<PayoutDTO>
  updatePayouts(data: UpdatePayoutDTO[], sharedContext?: Context): Promise<PayoutDTO[]>
  updatePayouts(data: UpdatePayoutDTO, sharedContext?: Context): Promise<PayoutDTO>
  deletePayouts(ids: string | string[], sharedContext?: Context): Promise<void>

  retrievePayoutReversal(
    id: string,
    config?: FindConfig<PayoutReversalDTO>,
    sharedContext?: Context
  ): Promise<PayoutReversalDTO>
  listPayoutReversals(
    filters?: FilterablePayoutReversalProps,
    config?: FindConfig<PayoutReversalDTO>,
    sharedContext?: Context
  ): Promise<PayoutReversalDTO[]>
  listAndCountPayoutReversals(
    filters?: FilterablePayoutReversalProps,
    config?: FindConfig<PayoutReversalDTO>,
    sharedContext?: Context
  ): Promise<[PayoutReversalDTO[], number]>
  createPayoutReversals(
    data: CreatePayoutReversalDTO[],
    sharedContext?: Context
  ): Promise<PayoutReversalDTO[]>
  createPayoutReversals(
    data: CreatePayoutReversalDTO,
    sharedContext?: Context
  ): Promise<PayoutReversalDTO>
  updatePayoutReversals(
    data: UpdatePayoutReversalDTO[],
    sharedContext?: Context
  ): Promise<PayoutReversalDTO[]>
  updatePayoutReversals(
    data: UpdatePayoutReversalDTO,
    sharedContext?: Context
  ): Promise<PayoutReversalDTO>
  deletePayoutReversals(ids: string | string[], sharedContext?: Context): Promise<void>

  /**
   * Opens the account at the provider and stores it.
   */
  createPayoutAccount(
    data: CreatePayoutAccountDTO,
    sharedContext?: Context
  ): Promise<PayoutAccountDTO>
  /**
   * Pulls the account from the provider and stores its flags and KYC status.
   */
  syncPayoutAccount(id: string, sharedContext?: Context): Promise<PayoutAccountDTO>
  /**
   * Deletes the account at the provider, when the provider supports it, and
   * then the stored row.
   */
  deletePayoutAccount(id: string, sharedContext?: Context): Promise<void>
  /**
   * Publishes the link the seller follows next: an onboarding link until the
   * provider has their details, a dashboard login link afterwards.
   */
  createOnboarding(data: CreateOnboardingDTO, sharedContext?: Context): Promise<OnboardingDTO>
  /**
   * Sends a pending or failed payout to the provider. A provider error is
   * recorded on the payout instead of thrown.
   */
  processPayout(id: string, sharedContext?: Context): Promise<PayoutDTO>
  processPayoutReversal(id: string, sharedContext?: Context): Promise<PayoutReversalDTO>
  getWebhookActionAndData(data: PayoutWebhookActionInput): Promise<PayoutWebhookResult>
}
