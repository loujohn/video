import { z } from 'zod/v4'

const reviewStatusEnum = z.enum(['draft', 'in_review', 'confirmed'])

export const createCharacterLookSchema = z.object({
  name: z.string().min(1, '形象名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  is_base: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  review_status: reviewStatusEnum.optional(),
})

export const updateCharacterLookSchema = createCharacterLookSchema.partial().extend({
  is_active: z.boolean().optional(),
})
