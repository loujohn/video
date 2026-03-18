export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  const required: Record<string, string> = {
    databaseUrl: config.databaseUrl,
    jwtSecret: config.jwtSecret,
  }

  const missing: string[] = []
  for (const [key, value] of Object.entries(required)) {
    if (!value || value === 'dev-secret') {
      if (process.env.NODE_ENV === 'production') {
        missing.push(key)
      }
    }
  }

  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`)
    console.error('Set these in .env or environment before starting production server.')
    process.exit(1)
  }
})
