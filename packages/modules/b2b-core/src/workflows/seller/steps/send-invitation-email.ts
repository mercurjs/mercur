import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { CreateSellerInvitationDTO } from "@mercurjs/framework";

import {
  Hosts,
  buildHostAddress,
} from "../../../shared/infra/http/utils/hosts";

export const sendSellerInvitationEmailStep = createStep(
  "send-seller-invitation-email",
  async (input: CreateSellerInvitationDTO, { container }) => {
    const service = container.resolve(Modules.NOTIFICATION);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    try {
      const notification = await service.createNotifications({
        channel: "email",
        to: input.email,
        template: "newSellerInvitation",
        content: {
          subject: `You've been invited to join Mercur`,
        },
        data: {
          data: {
            url: buildHostAddress(Hosts.VENDOR_PANEL, "/register"),
          },
        },
      });

      return new StepResponse(notification);
    } catch (e) {
      logger.error(e);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Notification provider failed!"
      );
    }
  }
);
