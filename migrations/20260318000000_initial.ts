import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  // users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('email').unique().notNullable()
    t.string('name').notNullable()
    t.string('avatar')
    t.string('password_hash').notNullable()
    t.timestamps(true, true)
  })

  // teams
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('name').notNullable()
    t.text('description')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamps(true, true)
  })

  // team_members
  await knex.schema.createTable('team_members', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE').notNullable()
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    t.enum('role', ['owner', 'editor', 'viewer']).defaultTo('editor').notNullable()
    t.timestamp('joined_at').defaultTo(knex.fn.now())
    t.unique(['team_id', 'user_id'])
  })

  // projects
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE').notNullable()
    t.string('title').notNullable()
    t.jsonb('genre').defaultTo('[]')
    t.string('audience')
    t.string('tone')
    t.string('ending_type')
    t.integer('total_episodes').defaultTo(60)
    t.string('language').defaultTo('zh-CN')
    t.string('mode').defaultTo('domestic')
    t.enum('status', ['draft', 'in_progress', 'review', 'completed']).defaultTo('draft')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamps(true, true)
  })

  // creative_plans
  await knex.schema.createTable('creative_plans', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').unique().notNullable()
    t.jsonb('content').defaultTo('{}')
    t.integer('version').defaultTo(1)
    t.timestamps(true, true)
  })

  // characters
  await knex.schema.createTable('characters', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.integer('age')
    t.text('appearance')
    t.jsonb('personality_tags').defaultTo('[]')
    t.string('public_identity')
    t.string('real_identity')
    t.text('motivation')
    t.text('conflict_point')
    t.string('catchphrase')
    t.text('arc_description')
    t.integer('villain_level')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // character_relations
  await knex.schema.createTable('character_relations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.uuid('from_character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.uuid('to_character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.string('relation_type').notNullable()
    t.text('description')
  })

  // scenes
  await knex.schema.createTable('scenes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.string('location_type')
    t.string('time_of_day')
    t.text('description')
    t.jsonb('tags').defaultTo('[]')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // props
  await knex.schema.createTable('props', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.jsonb('tags').defaultTo('[]')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // episodes
  await knex.schema.createTable('episodes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.integer('episode_number').notNullable()
    t.string('title')
    t.text('synopsis')
    t.string('hook_type')
    t.boolean('is_key_episode').defaultTo(false)
    t.boolean('is_paywall').defaultTo(false)
    t.integer('act')
    t.string('rhythm_phase')
    t.enum('status', ['planned', 'writing', 'written']).defaultTo('planned')
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
    t.unique(['project_id', 'episode_number'])
  })

  // episode_scripts
  await knex.schema.createTable('episode_scripts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('episode_id').references('id').inTable('episodes').onDelete('CASCADE').notNullable()
    t.text('content')
    t.integer('version').defaultTo(1)
    t.integer('word_count').defaultTo(0)
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  // storyboards
  await knex.schema.createTable('storyboards', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('episode_id').references('id').inTable('episodes').onDelete('CASCADE').notNullable()
    t.integer('sequence_number').notNullable()
    t.string('shot_type')
    t.uuid('scene_id').references('id').inTable('scenes').onDelete('SET NULL')
    t.text('description')
    t.text('dialogue')
    t.text('action_direction')
    t.text('music_cue')
    t.decimal('duration_seconds', 6, 2)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  // assets
  await knex.schema.createTable('assets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    t.string('type').notNullable()
    t.string('category').notNullable()
    t.string('file_path').notNullable()
    t.string('file_name')
    t.bigInteger('file_size')
    t.string('mime_type')
    t.jsonb('metadata').defaultTo('{}')
    t.string('linked_entity_type')
    t.uuid('linked_entity_id')
    t.boolean('is_active').defaultTo(true)
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  // entity_versions
  await knex.schema.createTable('entity_versions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('entity_type').notNullable()
    t.uuid('entity_id').notNullable()
    t.integer('version_number').notNullable()
    t.jsonb('snapshot').notNullable()
    t.text('change_summary')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['entity_type', 'entity_id', 'version_number'])
  })

  // indexes
  await knex.schema.raw('CREATE INDEX idx_assets_linked ON assets(linked_entity_type, linked_entity_id)')
  await knex.schema.raw('CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_type, entity_id)')
  await knex.schema.raw('CREATE INDEX idx_projects_team ON projects(team_id)')
  await knex.schema.raw('CREATE INDEX idx_episodes_project ON episodes(project_id)')
  await knex.schema.raw('CREATE INDEX idx_characters_project ON characters(project_id)')
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'entity_versions', 'assets', 'storyboards', 'episode_scripts',
    'episodes', 'props', 'scenes', 'character_relations', 'characters',
    'creative_plans', 'projects', 'team_members', 'teams', 'users',
  ]
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table)
  }
}
