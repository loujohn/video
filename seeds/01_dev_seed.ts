import type { Knex } from 'knex'
import { hash } from 'bcryptjs'

export async function seed(knex: Knex): Promise<void> {
  await knex('team_members').del()
  await knex('projects').del()
  await knex('teams').del()
  await knex('users').del()

  const passwordHash = await hash('password123', 12)

  const [user] = await knex('users')
    .insert({
      email: 'demo@drama.studio',
      name: '演示用户',
      password_hash: passwordHash,
    })
    .returning('*')

  const [team] = await knex('teams')
    .insert({
      name: '演示工作室',
      description: '这是一个演示团队',
      created_by: user.id,
    })
    .returning('*')

  await knex('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'owner',
  })

  await knex('projects').insert({
    team_id: team.id,
    title: '偏偏宠你入骨',
    genre: JSON.stringify(['霸道总裁', '甜宠']),
    audience: '女频',
    tone: '甜虐',
    ending_type: 'HE',
    total_episodes: 60,
    language: 'zh-CN',
    mode: 'domestic',
    status: 'in_progress',
    created_by: user.id,
  })
}
