import { z } from 'zod/v4'

export const createStoryboardSchema = z.object({
  scene_id: z.string().uuid().optional().nullable(),
  scene_variant_id: z.string().uuid().optional().nullable(),
  character_look_ids: z.array(z.string().uuid()).optional(),
  prop_variant_ids: z.array(z.string().uuid()).optional(),
  sequence_number: z.number().int().min(1).optional(),
  shot_type: z.string().max(50).optional(),
  camera_angle: z.string().max(50).optional(),
  camera_movement: z.string().max(100).optional(),
  transition_type: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  dialogue: z.string().max(5000).optional(),
  action_direction: z.string().max(5000).optional(),
  music_cue: z.string().max(1000).optional(),
  sound_effects: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  duration_seconds: z.number().min(0).max(3600).optional().nullable(),
  reference_image_url: z.string().url().max(2000).optional().nullable(),
  image_prompt: z.string().max(5000).optional(),
  video_prompt: z.string().max(10000).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const updateStoryboardSchema = createStoryboardSchema.partial()

export const reorderStoryboardsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})
