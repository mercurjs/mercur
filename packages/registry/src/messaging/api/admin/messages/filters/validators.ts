import { z } from "zod"

export type AdminCreateFilterType = z.infer<typeof AdminCreateFilter>
export const AdminCreateFilter = z.object({
  match_type: z.enum(["exact", "contains"]),
  pattern: z.string().min(1).max(500),
  description: z.string().max(500).optional(),
  is_enabled: z.boolean().optional().default(true),
})

export type AdminUpdateFilterType = z.infer<typeof AdminUpdateFilter>
export const AdminUpdateFilter = z.object({
  match_type: z.enum(["exact", "contains"]).optional(),
  pattern: z.string().min(1).max(500).optional(),
  description: z.string().max(500).optional(),
  is_enabled: z.boolean().optional(),
})

export type AdminListFiltersType = z.infer<typeof AdminListFilters>
export const AdminListFilters = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export type AdminListBlockedType = z.infer<typeof AdminListBlocked>
export const AdminListBlocked = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  sender_type: z.enum(["customer", "seller"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})
