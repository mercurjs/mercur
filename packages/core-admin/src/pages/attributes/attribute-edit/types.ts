import type { AdminProductCategory } from "@medusajs/types";

import type { z } from "zod";

import type { CreateAttributeFormSchema } from "@pages/attributes/attribute-edit/schema.ts";
import { AdminUpdateAttribute } from "@pages/attributes/attribute-edit/schema.ts";

import type { AttributeDTO } from "@/types";

export type CreateFormValues = z.infer<typeof CreateAttributeFormSchema>;

export const UpdateAttributeFormSchema = AdminUpdateAttribute;

export type UpdateFormValues = z.infer<typeof UpdateAttributeFormSchema>;

export interface AttributeFormProps {
  initialData?: AttributeDTO;
  onSubmit: (data: CreateFormValues | UpdateFormValues) => Promise<void>;
  categories?: AdminProductCategory[];
  mode?: "create" | "update";
  activeTab?: "details" | "type";
  onFormStateChange?: (formState: {
    detailsStatus: "not-started" | "in-progress" | "completed";
    typeStatus: "not-started" | "in-progress" | "completed";
  }) => void;
}
export enum AttributeUIComponent {
  SELECT = "select",
  MULTIVALUE = "multivalue",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXTAREA = "text_area",
}
