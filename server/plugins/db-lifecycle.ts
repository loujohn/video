import { closeDb } from '~/core/db'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('close', async () => {
    await closeDb()
  })
})
