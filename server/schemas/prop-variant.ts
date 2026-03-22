import { z } from 'zod/v4'

export const createPropVariantSchema = z.object({
  name: z.string().min(1, '变体名称必填').max(100),
  description: z.string().max(2000).optional(),
  image_prompt: z.string().max(5000).optional(),
  variant_type: z.preprocess(v => (v === '' ? undefined : v), z.enum(['style', 'condition', 'angle', 'detail']).optional()),
  sort_order: z.number().int().optional(),
})

export const updatePropVariantSchema = createPropVariantSchema.partial().extend({
  is_active: z.boolean().optional(),
})
