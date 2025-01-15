import { BuyerAccountCreatedEmailTemplate } from './buyer-account-created'
import { BuyerCancelOrderEmailTemplate } from './buyer-cancel-order'
import { BuyerNewOrderEmailTemplate } from './buyer-new-order'
import { BuyerOrderShippedEmailTemplate } from './buyer-shipped-order'
import { ForgotPasswordEmailTemplate } from './forgot-password'
import { VendorAccountApprovedEmailTemplate } from './vendor-account-approved'
import { VendorAccountRejectedEmailTemplate } from './vendor-account-rejected'
import { VendorAccountSubmissionEmailTemplate } from './vendor-account-updates-submission'
import { VendorCanceledOrderEmailTemplate } from './vendor-canceled-order'
import { VendorNewOrderEmailTemplate } from './vendor-new-order'
import { VendorOrderShippingEmailTemplate } from './vendor-shipping-order'
import { VendorTeamInviteEmailTemplate } from './vendor-team-invite'
import { VendorEmailVerifyEmailTemplate } from './vendor-verify-email'

export const emailTemplates = {
  buyerAccountCreatedEmailTemplate: BuyerAccountCreatedEmailTemplate,
  buyerCancelOrderEmailTemplate: BuyerCancelOrderEmailTemplate,
  buyerNewOrderEmailTemplate: BuyerNewOrderEmailTemplate,
  buyerOrderShippedEmailTemplate: BuyerOrderShippedEmailTemplate,
  forgotPasswordEmailTemplate: ForgotPasswordEmailTemplate,
  vendorAccountApprovedEmailTemplate: VendorAccountApprovedEmailTemplate,
  vendorAccountRejectedEmailTemplate: VendorAccountRejectedEmailTemplate,
  vendorAccountSubmissionEmailTemplate: VendorAccountSubmissionEmailTemplate,
  vendorCanceledOrderEmailTemplate: VendorCanceledOrderEmailTemplate,
  vendorNewOrderEmailTemplate: VendorNewOrderEmailTemplate,
  vendorOrderShippingEmailTemplate: VendorOrderShippingEmailTemplate,
  vendorTeamInviteEmailTemplate: VendorTeamInviteEmailTemplate,
  vendorVerifyEmailTemplate: VendorEmailVerifyEmailTemplate
}
