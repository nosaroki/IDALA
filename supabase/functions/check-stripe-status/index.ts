import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return json({ error: 'MISSING_TOKEN' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Retrouver le praticien via son token d'onboarding
    const { data: praticien } = await supabase
      .from('praticiens')
      .select('id, prenom')
      .eq('onboarding_token', token)
      .single();

    // Token inconnu : la page affichera "lien invalide"
    if (!praticien) {
      return json({ found: false, completed: false }, 200);
    }

    // Compte Stripe rattaché ?
    const { data: sa } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('praticien_id', praticien.id)
      .maybeSingle();

    // Pas encore de compte : onboarding pas commencé
    if (!sa?.stripe_account_id) {
      return json({ found: true, completed: false, prenom: praticien.prenom }, 200);
    }

    // État réel lu directement chez Stripe, sans dépendre du webhook ni de la base
    const account = await stripe.accounts.retrieve(sa.stripe_account_id);
    const chargesEnabled = account.charges_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    return json({
      found: true,
      completed: chargesEnabled && detailsSubmitted,
      charges_enabled: chargesEnabled,
      details_submitted: detailsSubmitted,
      prenom: praticien.prenom,
    }, 200);

  } catch (err) {
    return json({ error: 'SERVER_ERROR', details: String(err) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}