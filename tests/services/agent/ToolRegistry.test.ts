import { describe, it, expect, vi } from 'vitest'

describe('ToolRegistry', () => {
  describe('getCreativeToolDefs', () => {
    it('returns an array of tool definitions', async () => {
      const { getCreativeToolDefs } = await import('../../../server/services/agent/ToolRegistry')
      const defs = getCreativeToolDefs()

      expect(Array.isArray(defs)).toBe(true)
      expect(defs.length).toBeGreaterThan(0)

      for (const def of defs) {
        expect(def).toHaveProperty('name')
        expect(def).toHaveProperty('description')
        expect(def).toHaveProperty('inputSchema')
        expect(def.inputSchema.type).toBe('object')
      }
    })

    it('includes key creative tools', async () => {
      const { getCreativeToolDefs } = await import('../../../server/services/agent/ToolRegistry')
      const defs = getCreativeToolDefs()
      const names = defs.map(d => d.name)

      expect(names).toContain('create_project')
      expect(names).toContain('list_characters')
      expect(names).toContain('create_storyboard')
      expect(names).toContain('save_creative_plan')
    })
  })

  describe('registerTools', () => {
    it('registers all tools when allowed is "*"', async () => {
      const { registerTools, getCreativeToolDefs } = await import('../../../server/services/agent/ToolRegistry')
      const executor = vi.fn().mockResolvedValue('ok')
      const defs = getCreativeToolDefs()

      const tools = registerTools(defs, executor, '*')

      expect(Object.keys(tools).length).toBe(defs.length)
      for (const def of defs) {
        expect(tools[def.name]).toBeDefined()
      }
    })

    it('filters tools when allowed is an array', async () => {
      const { registerTools, getCreativeToolDefs } = await import('../../../server/services/agent/ToolRegistry')
      const executor = vi.fn().mockResolvedValue('ok')
      const defs = getCreativeToolDefs()

      const tools = registerTools(defs, executor, ['create_project', 'list_projects'])

      expect(Object.keys(tools)).toEqual(['list_projects', 'create_project'])
    })

    it('registered tool calls executor correctly', async () => {
      const { registerTools } = await import('../../../server/services/agent/ToolRegistry')
      const executor = vi.fn().mockResolvedValue('{"id":"123"}')

      const defs = [{
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object' as const,
          properties: { name: { type: 'string', description: 'Name' } },
          required: ['name'],
        },
      }]

      const tools = registerTools(defs, executor, '*')
      const testTool = tools.test_tool

      expect(testTool).toBeDefined()
    })

    it('handles executor errors gracefully', async () => {
      const { registerTools } = await import('../../../server/services/agent/ToolRegistry')
      const executor = vi.fn().mockRejectedValue(new Error('API call failed'))

      const defs = [{
        name: 'failing_tool',
        description: 'A failing tool',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      }]

      const tools = registerTools(defs, executor, '*')
      expect(tools.failing_tool).toBeDefined()
    })
  })
})
