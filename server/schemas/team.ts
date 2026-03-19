import { z } from 'zod/v4'

export const createTeamSchema = z.object({
  name: z.string().min(1, '团队名必填').max(100),
  description: z.string().max(1000).optional(),
})

export const updateTeamSchema = createTeamSchema.partial()

export const addMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['editor', 'viewer']).optional(),
})
