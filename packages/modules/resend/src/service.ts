import { Resend } from "resend";

import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import { ProviderSendNotificationDTO } from "@medusajs/types";

import { emailTemplates } from "./email-templates";

/**
 * @interface ResendOptions
 * @description Represents the options for the resend notification provider.
 * @property {string} api_key - The api key of the resend options.
 * @property {string} from - The from of the resend options.
 */
type ResendOptions = {
  api_key: string;
  from: string;
};

/**
 * @class ResendNotificationProviderService
 * @description Represents the resend notification provider service.
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  private resendClient: Resend;
  private options: ResendOptions;

  constructor(_, options: ResendOptions) {
    super();
    this.validateModuleOptions(options);
    this.resendClient = new Resend(options.api_key);
    this.options = options;
  }

  /**
   * @method validateModuleOptions
   * @description This method ensures all keys in options are present for resend notification service
   *
   * @param {ResendOptions} options - Settings for resending notifications
   * @returns {void} Resolves when Ensures given settings align with module requirements before activation.
   */
  validateModuleOptions(options: ResendOptions) {
    for (const key in options) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `No ${key} was provided in the ${ResendNotificationProviderService.identifier} options. Please add one.`
        );
      }
    }
  }

  /**
   * @method send
   * @description This method sends an email notification based on a template
   *
   * @param {ProviderSendNotificationDTO} notification - The provider send notification details.
   * @returns {Promise<CreateEmailResponseSuccess>} Represents the completion of an asynchronous operation
   */
  async send(notification: ProviderSendNotificationDTO) {
    const { data, error } = await this.resendClient.emails.send({
      from: notification.from?.trim() || this.options.from,
      to: notification.to,
      subject: notification.content?.subject as string,
      react: emailTemplates[notification.template](notification.data),
    });

    if (error) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message);
    }

    if (!data) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "No data returned by resend client"
      );
    }

    return data;
  }
}

export default ResendNotificationProviderService;
