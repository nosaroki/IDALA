import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { token, iban } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  )

  const { data: praticien, error: fetchError } = await supabase
    .from('praticiens')
    .select('id')
    .eq('onboarding_token', token)
    .single()

  if (fetchError || !praticien) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 401,
      headers: corsHeaders
    })
  }

  const { error: updateError } = await supabase
    .from('praticiens')
    .update({
      iban,
      actif: true,
      onboarding_token: null,
    })
    .eq('id', praticien.id)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: corsHeaders
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})