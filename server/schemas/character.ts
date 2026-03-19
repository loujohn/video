import { z } from 'zod/v4'

export const createCharacterSchema = z.object({
  name: z.string().min(1, '角色名必填').max(100),
  age: z.number().int().min(0).max(200).optional().nullable(),
  appearance: z.string().max(2000).optional(),
  personality_tags: z.array(z.string().max(50)).max(20).optional(),
  public_identity: z.string().max(200).optional(),
  real_identity: z.string().max(200).optional(),
  motivation: z.string().max(2000).optional(),
  conflict_point: z.string().max(2000).optional(),
  catchphrase: z.string().max(500).optional(),
  arc_description: z.string().max(2000).optional(),
  villain_level: z.number().int().min(0).max(10).optional().nullable(),
  image_prompt: z.string().max(5000).optional(),
  sort_order: z.number().int().optional(),
})

export const updateCharacterSchema = createCharacterSchema.partial()

export const characterRelationSchema = z.object({
  from_character_id: z.string().uuid(),
  to_character_id: z.string().uuid(),
  relation_type: z.string().min(1, '关系类型必填').max(50),
  description: z.string().max(500).optional(),
})
