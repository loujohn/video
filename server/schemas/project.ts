import { z } from 'zod/v4'

export const createProjectSchema = z.object({
  team_id: z.string().uuid(),
  title: z.string().min(1, '标题必填').max(200),
  genre: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  ending_type: z.string().max(50).optional(),
  total_episodes: z.number().int().min(1).max(9999).optional(),
  language: z.string().max(10).optional(),
  mode: z.string().max(50).optional(),
})

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  genre: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  ending_type: z.string().max(50).optional(),
  total_episodes: z.number().int().min(1).max(9999).optional(),
  language: z.string().max(10).optional(),
  mode: z.string().max(50).optional(),
  status: z.enum(['draft', 'in_progress', 'review', 'completed']).optional(),
})
