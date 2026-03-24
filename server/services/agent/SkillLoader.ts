import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { SkillMeta } from '~/core/types/agent'

const SKILLS_DIR = resolve(process.cwd(), 'skills')

export interface LoadedSkill extends SkillMeta {
  systemPrompt: string
  referenceFiles: string[]
}

export async function listSkills(): Promise<SkillMeta[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true })
  const skills: SkillMeta[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaPath = join(SKILLS_DIR, entry.name, 'skill.json')
    try {
      const raw = await readFile(metaPath, 'utf-8')
      skills.push(JSON.parse(raw) as SkillMeta)
    }
    catch {
      // skip directories without skill.json
    }
  }

  return skills
}

export async function loadSkill(skillId: string): Promise<LoadedSkill> {
  const dir = join(SKILLS_DIR, skillId)
  const metaRaw = await readFile(join(dir, 'skill.json'), 'utf-8')
  const meta = JSON.parse(metaRaw) as SkillMeta

  const promptPath = join(dir, 'SKILL.md')
  const systemPrompt = await readFile(promptPath, 'utf-8')

  const refsDir = join(dir, 'references')
  let referenceFiles: string[] = []
  try {
    const refEntries = await readdir(refsDir)
    referenceFiles = refEntries.filter(f => f.endsWith('.md'))
  }
  catch {
    // no references directory
  }

  return { ...meta, systemPrompt, referenceFiles }
}

export async function loadReference(skillId: string, refName: string): Promise<string> {
  const refPath = join(SKILLS_DIR, skillId, 'references', refName)
  return readFile(refPath, 'utf-8')
}
