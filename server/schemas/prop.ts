import { z } from 'zod/v4'

export const createPropSchema = z.object({
  name: z.string().min(1, '道具名必填').max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  image_prompt: z.string().max(5000).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const updatePropSchema = createPropSchema.partial()
