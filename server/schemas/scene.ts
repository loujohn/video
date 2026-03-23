import { z } from 'zod/v4'

export const createSceneSchema = z.object({
  name: z.string().min(1, '场景名必填').max(100),
  location_type: z.string().max(50).optional(),
  time_of_day: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  image_prompt: z.string().max(5000).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const updateSceneSchema = createSceneSchema.partial()
