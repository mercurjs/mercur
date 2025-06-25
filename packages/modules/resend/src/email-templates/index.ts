import { AdminRequestCreatedEmailTemplate } from "./admin-request-created";
import { AdminSellerRequestCreatedEmailTemplate } from "./admin-seller-request-created";
import { BuyerAccountCreatedEmailTemplate } from "./buyer-account-created";
import { BuyerCancelOrderEmailTemplate } from "./buyer-cancel-order";
import { BuyerNewOrderEmailTemplate } from "./buyer-new-order";
import { BuyerOrderShippedEmailTemplate } from "./buyer-shipped-order";
import { ForgotPasswordEmailTemplate } from "./forgot-password";
import { NewSellerInviteEmailTemplate } from "./new-seller-invitation";
import { SellerAccountApprovedEmailTemplate } from "./seller-account-approved";
import { SellerAccountRejectedEmailTemplate } from "./seller-account-rejected";
import { SellerAccountSubmissionEmailTemplate } from "./seller-account-updates-submission";
import { SellerCanceledOrderEmailTemplate } from "./seller-canceled-order";
import { SellerNewOrderEmailTemplate } from "./seller-new-order";
import { SellerProductApprovedEmailTemplate } from "./seller-product-approved";
import { SellerProductRejectedEmailTemplate } from "./seller-product-rejected";
import { SellerOrderShippingEmailTemplate } from "./seller-shipping-order";
import { SellerTeamInviteEmailTemplate } from "./seller-team-invite";
import { SellerEmailVerifyEmailTemplate } from "./seller-verify-email";

export const emailTemplates: any = {
  buyerAccountCreatedEmailTemplate: BuyerAccountCreatedEmailTemplate,
  buyerCancelOrderEmailTemplate: BuyerCancelOrderEmailTemplate,
  buyerNewOrderEmailTemplate: BuyerNewOrderEmailTemplate,
  buyerOrderShippedEmailTemplate: BuyerOrderShippedEmailTemplate,
  forgotPasswordEmailTemplate: ForgotPasswordEmailTemplate,
  sellerAccountApprovedEmailTemplate: SellerAccountApprovedEmailTemplate,
  sellerAccountRejectedEmailTemplate: SellerAccountRejectedEmailTemplate,
  sellerAccountSubmissionEmailTemplate: SellerAccountSubmissionEmailTemplate,
  sellerCanceledOrderEmailTemplate: SellerCanceledOrderEmailTemplate,
  sellerNewOrderEmailTemplate: SellerNewOrderEmailTemplate,
  sellerOrderShippingEmailTemplate: SellerOrderShippingEmailTemplate,
  sellerTeamInviteEmailTemplate: SellerTeamInviteEmailTemplate,
  sellerVerifyEmailTemplate: SellerEmailVerifyEmailTemplate,
  newSellerInvitation: NewSellerInviteEmailTemplate,
  sellerProductRejectedEmailTemplate: SellerProductRejectedEmailTemplate,
  sellerProductApprovedEmailTemplate: SellerProductApprovedEmailTemplate,
  adminRequestCreatedEmailTemplate: AdminRequestCreatedEmailTemplate,
  adminSellerRequestCreatedEmailTemplate:
    AdminSellerRequestCreatedEmailTemplate,
};
