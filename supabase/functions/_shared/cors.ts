const PRIMARY = 'https://bact-safety-observation-modern.vercel.app'

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (origin === PRIMARY) return true
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') return true
  try {
    const url = new URL(origin)
    return (
      url.protocol === 'https:' &&
      /\.vercel\.app$/i.test(url.hostname) &&
      /bact-safety-observation/i.test(url.hostname)
    )
  } catch {
    return false
  }
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allow = isAllowedOrigin(origin) ? origin! : PRIMARY
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}
