import { z } from 'zod/v4'

const reviewStatusEnum = z.enum(['pending', 'approved'])

export const createSceneVariantSchema = z.object({
  name: z.string().min(1, '变体名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  variant_type: z.preprocess(v => (v === '' ? undefined : v), z.enum(['time', 'weather', 'angle', 'composition']).optional()),
  sort_order: z.number().int().optional(),
  review_status: reviewStatusEnum.optional(),
})

export const updateSceneVariantSchema = createSceneVariantSchema.partial().extend({
  is_active: z.boolean().optional(),
})
