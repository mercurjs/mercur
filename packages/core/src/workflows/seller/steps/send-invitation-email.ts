import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

type SendInvitationEmailInput = {
  email: string
  registration_url?: string
}

function buildInvitationHtml(email: string, registrationUrl?: string): string {
  const ctaBlock = registrationUrl
    ? `<tr>
        <td style="padding: 24px 0 0;">
          <a href="${registrationUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Create your seller account</a>
        </td>
      </tr>`
    : ""

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr>
            <td style="font-size:20px;font-weight:600;color:#18181b;padding-bottom:16px;">
              You've been invited to sell on our marketplace
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#52525b;line-height:1.6;">
              An invitation has been sent to <strong>${email}</strong> to join as a seller. You can set up your store, list products, and start selling.
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="font-size:12px;color:#a1a1aa;padding-top:32px;border-top:1px solid #e4e4e7;margin-top:32px;">
              If you did not expect this invitation, you can ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const sendSellerInvitationEmailStep = createStep(
  "send-seller-invitation-email",
  async (input: SendInvitationEmailInput, { container }) => {
    const notificationService = container.resolve<INotificationModuleService>(
      Modules.NOTIFICATION
    )

    const notification = await notificationService.createNotifications({
      to: input.email,
      channel: "email",
      template: "newSellerInvitation",
      data: {
        email: input.email,
        registration_url: input.registration_url,
      },
      content: {
        subject: "You've been invited to sell on our marketplace",
        html: buildInvitationHtml(input.email, input.registration_url),
      },
    })

    return new StepResponse(notification)
  }
)
