import { describe, it, expect } from 'vitest'
import { listSkills, loadSkill, loadReference } from '../../../server/services/agent/SkillLoader'

describe('SkillLoader (integration)', () => {
  describe('listSkills', () => {
    it('returns at least the drama-writer skill', async () => {
      const skills = await listSkills()

      expect(skills.length).toBeGreaterThanOrEqual(1)

      const dramaWriter = skills.find(s => s.id === 'drama-writer')
      expect(dramaWriter).toBeDefined()
      expect(dramaWriter!.name).toBe('微短剧 AI 编剧')
      expect(dramaWriter!.icon).toBe('🎬')
      expect(dramaWriter!.tools).toBe('*')
    })

    it('returns valid SkillMeta objects', async () => {
      const skills = await listSkills()

      for (const skill of skills) {
        expect(skill).toHaveProperty('id')
        expect(skill).toHaveProperty('name')
        expect(skill).toHaveProperty('description')
        expect(typeof skill.id).toBe('string')
        expect(typeof skill.name).toBe('string')
      }
    })
  })

  describe('loadSkill', () => {
    it('loads drama-writer skill with system prompt', async () => {
      const skill = await loadSkill('drama-writer')

      expect(skill.id).toBe('drama-writer')
      expect(skill.systemPrompt).toBeTruthy()
      expect(skill.systemPrompt.length).toBeGreaterThan(100)
      expect(skill.systemPrompt).toContain('编剧')
    })

    it('includes reference files list', async () => {
      const skill = await loadSkill('drama-writer')

      expect(Array.isArray(skill.referenceFiles)).toBe(true)
      expect(skill.referenceFiles.length).toBeGreaterThan(0)
      expect(skill.referenceFiles).toContain('genre-guide.md')
      expect(skill.referenceFiles).toContain('villain-design.md')
    })

    it('throws for nonexistent skill', async () => {
      await expect(loadSkill('nonexistent-skill')).rejects.toThrow()
    })
  })

  describe('loadReference', () => {
    it('loads a reference file', async () => {
      const content = await loadReference('drama-writer', 'genre-guide.md')

      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(50)
    })

    it('throws for nonexistent reference', async () => {
      await expect(loadReference('drama-writer', 'nonexistent.md')).rejects.toThrow()
    })
  })
})
