// Deprecated unauthenticated mailer. Use process-notifications.
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Gone. Use process-notifications.',
    }),
    {
      status: 410,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    },
  )
})
