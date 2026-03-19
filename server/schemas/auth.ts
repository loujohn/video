import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z.email('邮箱格式不正确'),
  password: z.string().min(1, '密码必填'),
})

export const registerSchema = z.object({
  email: z.email('邮箱格式不正确'),
  name: z.string().min(1, '名称必填').max(100),
  password: z.string().min(6, '密码至少 6 个字符').max(200),
})
