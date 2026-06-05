import i18n from "i18next";
import { z } from "zod";

export const CreateStoreSchema = z.object({
  name: z
    .string()
    .min(1, { message: i18n.t("stores.create.validation.nameRequired") }),
  email: z
    .string()
    .min(1, { message: i18n.t("stores.create.validation.emailRequired") })
    .email({ message: i18n.t("stores.create.validation.emailInvalid") }),
  phone: z.string().optional().or(z.literal("")),
  currency_code: z
    .string()
    .min(1, { message: i18n.t("stores.create.validation.currencyRequired") }),
  handle: z.string().optional().or(z.literal("")),
  member_email: z
    .string()
    .min(1, { message: i18n.t("stores.create.validation.emailRequired") })
    .email({ message: i18n.t("stores.create.validation.emailInvalid") }),
});

export type CreateStoreSchemaType = z.infer<typeof CreateStoreSchema>;
