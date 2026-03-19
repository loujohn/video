import { z } from 'zod/v4'

export const createEpisodeSchema = z.object({
  episode_number: z.number().int().min(1, '集数必填'),
  title: z.string().max(200).optional(),
  synopsis: z.string().max(5000).optional(),
  hook_type: z.string().max(100).optional(),
  is_key_episode: z.boolean().optional(),
  is_paywall: z.boolean().optional(),
  act: z.number().int().min(1).max(10).optional().nullable(),
  rhythm_phase: z.string().max(50).optional(),
})

export const updateEpisodeSchema = createEpisodeSchema.partial().extend({
  status: z.enum(['planned', 'writing', 'written']).optional(),
})
