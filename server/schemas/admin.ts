import { z } from 'zod/v4'

export const updateUserSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50).optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional(),
})

export const listUsersSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.string().transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})
