import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

describe('ToolExecutor', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('routes list_projects to GET /api/projects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [{ id: '1', title: 'Test' }] })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    const result = await executeToolCall('list_projects', {})

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects')
    expect(opts.method).toBe('GET')

    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed)).toBe(true)
  })

  it('routes create_project to POST /api/projects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'new-1', title: 'New Project' } })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    await executeToolCall('create_project', { title: 'New Project', team_id: 'team-1' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toHaveProperty('title', 'New Project')
  })

  it('routes get_project with project_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'proj-1' } })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    await executeToolCall('get_project', { project_id: 'proj-1' })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects/proj-1')
  })

  it('returns error JSON for unknown tools', async () => {
    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    const result = await executeToolCall('nonexistent_tool', {})

    const parsed = JSON.parse(result)
    expect(parsed.error).toBe(true)
    expect(parsed.message).toContain('Unknown tool')
  })

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    const result = await executeToolCall('get_project', { project_id: 'bad-id' })

    const parsed = JSON.parse(result)
    expect(parsed.error).toBe(true)
    expect(parsed.status).toBe(404)
  })

  it('routes character operations correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    await executeToolCall('list_characters', { project_id: 'proj-1' })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects/proj-1/characters')
  })

  it('routes storyboard operations correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    await executeToolCall('list_storyboards', { project_id: 'proj-1', episode_number: 1 })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects/proj-1/episodes/1/storyboards')
  })

  it('routes update_storyboard with all path params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: { id: 'sb-1' } })),
    })

    const { executeToolCall } = await import('../../../server/services/agent/ToolExecutor')
    await executeToolCall('update_storyboard', {
      project_id: 'proj-1',
      episode_number: 2,
      storyboard_id: 'sb-1',
      description: 'Updated',
    })

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/projects/proj-1/episodes/2/storyboards/sb-1')
    expect(opts.method).toBe('PUT')
    const body = JSON.parse(opts.body)
    expect(body.description).toBe('Updated')
    expect(body).not.toHaveProperty('project_id')
    expect(body).not.toHaveProperty('episode_number')
    expect(body).not.toHaveProperty('storyboard_id')
  })
})
