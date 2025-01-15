// import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
// import {
//   ICustomerModuleService,
//   INotificationModuleService,
// } from '@medusajs/framework/types';
// import { Modules } from '@medusajs/framework/utils';

// import { isTestEnv } from '../config';
// import {
//   RESEND_RESET_PASSWORD_CREATED_EVENT,
//   RESET_PASSWORD_CREATED_EVENT,
// } from '../utils/constans';
// import { PasswordCreatedEvent } from '../utils/types/events';

// export default async function resetPasswordCreatedTokenHandler({
//   event: { data },
//   container,
// }: SubscriberArgs<PasswordCreatedEvent>) {
//   if (isTestEnv()) {
//     return;
//   }
//   const notificationModuleService: INotificationModuleService =
//     container.resolve(Modules.NOTIFICATION);

//   const customerModuleService: ICustomerModuleService = container.resolve(
//     Modules.CUSTOMER
//   );

//   const customer = (
//     await customerModuleService.listCustomers({
//       email: data.email,
//     })
//   )[0];

//   await notificationModuleService.createNotifications({
//     to: data.email,
//     channel: 'email',
//     template: process.env.SENDGRID_RESET_PASSWORD_TEMPLATE,
//     data: { code: data?.code, name: customer?.first_name },
//   });
// }

// export const config: SubscriberConfig = {
//   event: [RESET_PASSWORD_CREATED_EVENT, RESEND_RESET_PASSWORD_CREATED_EVENT],
// };
