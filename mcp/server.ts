import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { authTools, handleAuthTool } from './tools/auth-tools.js'
import { projectTools, handleProjectTool } from './tools/project-tools.js'
import { characterTools, handleCharacterTool } from './tools/character-tools.js'
import { scenePropTools, handleScenePropTool } from './tools/scene-prop-tools.js'
import { episodeTools, handleEpisodeTool } from './tools/episode-tools.js'
import { storyboardTools, handleStoryboardTool } from './tools/storyboard-tools.js'
import { assetTools, handleAssetTool } from './tools/asset-tools.js'
import { entityAssetTools, handleEntityAssetTool } from './tools/entity-asset-tools.js'
import { imageTools, handleImageTool } from './tools/image-tools.js'
import { versionTools, handleVersionTool } from './tools/version-tools.js'
import { commentTools, handleCommentTool } from './tools/comment-tools.js'
import { teamTools, handleTeamTool } from './tools/team-tools.js'
import { notificationTools, handleNotificationTool } from './tools/notification-tools.js'
import { adminTools, handleAdminTool } from './tools/admin-tools.js'
import { characterLookTools, handleCharacterLookTool } from './tools/character-look-tools.js'
import { sceneVariantTools, handleSceneVariantTool } from './tools/scene-variant-tools.js'
import { propVariantTools, handlePropVariantTool } from './tools/prop-variant-tools.js'

const allTools = [
  ...authTools,
  ...projectTools,
  ...characterTools,
  ...scenePropTools,
  ...episodeTools,
  ...storyboardTools,
  ...assetTools,
  ...entityAssetTools,
  ...imageTools,
  ...versionTools,
  ...commentTools,
  ...teamTools,
  ...notificationTools,
  ...adminTools,
  ...characterLookTools,
  ...sceneVariantTools,
  ...propVariantTools,
]

const toolHandlers: Record<string, (name: string, args: Record<string, unknown>) => Promise<string>> = {}
for (const t of authTools) toolHandlers[t.name] = handleAuthTool
for (const t of projectTools) toolHandlers[t.name] = handleProjectTool
for (const t of characterTools) toolHandlers[t.name] = handleCharacterTool
for (const t of scenePropTools) toolHandlers[t.name] = handleScenePropTool
for (const t of episodeTools) toolHandlers[t.name] = handleEpisodeTool
for (const t of storyboardTools) toolHandlers[t.name] = handleStoryboardTool
for (const t of assetTools) toolHandlers[t.name] = handleAssetTool
for (const t of entityAssetTools) toolHandlers[t.name] = handleEntityAssetTool
for (const t of imageTools) toolHandlers[t.name] = handleImageTool
for (const t of versionTools) toolHandlers[t.name] = handleVersionTool
for (const t of commentTools) toolHandlers[t.name] = handleCommentTool
for (const t of teamTools) toolHandlers[t.name] = handleTeamTool
for (const t of notificationTools) toolHandlers[t.name] = handleNotificationTool
for (const t of adminTools) toolHandlers[t.name] = handleAdminTool
for (const t of characterLookTools) toolHandlers[t.name] = handleCharacterLookTool
for (const t of sceneVariantTools) toolHandlers[t.name] = handleSceneVariantTool
for (const t of propVariantTools) toolHandlers[t.name] = handlePropVariantTool

const server = new Server(
  { name: 'video-drama-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const handler = toolHandlers[name]
  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    }
  }

  try {
    const result = await handler(name, (args ?? {}) as Record<string, unknown>)
    return { content: [{ type: 'text', text: result }] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: `Error: ${msg}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Video Drama MCP Server running on stdio')
