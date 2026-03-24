import { listSkills } from '~~/server/services/agent/SkillLoader'

export default defineEventHandler(async () => {
  const skills = await listSkills()
  return { success: true, data: skills }
})
