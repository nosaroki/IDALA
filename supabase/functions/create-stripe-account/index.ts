import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SITE_URL = 'https://theidalafamily.com';

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
    const { praticien_id } = await req.json();

    if (!praticien_id) {
      return jsonResponse({ error: 'praticien_id requis' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Lire le praticien (avec son onboarding_token) ----
    const { data: praticien, error: pErr } = await supabase
      .from('praticiens')
      .select('id, prenom, nom, email, onboarding_token')
      .eq('id', praticien_id)
      .single();

    if (pErr || !praticien) {
      return jsonResponse({ error: 'Praticien introuvable' }, 404);
    }
    if (!praticien.email) {
      return jsonResponse({ error: 'Le praticien n\'a pas d\'email' }, 400);
    }

    // ---- Token pour identifier le praticien au retour de Stripe ----
    // On réutilise l'onboarding_token existant, ou on en génère un si absent
    let token = praticien.onboarding_token;
    if (!token) {
      token = crypto.randomUUID();
      await supabase
        .from('praticiens')
        .update({ onboarding_token: token })
        .eq('id', praticien.id);
    }

    const returnUrl = `${SITE_URL}/#/onboarding-paiement/retour?token=${token}`;
    const refreshUrl = `${SITE_URL}/#/onboarding-paiement/refresh?token=${token}`;

    // ---- Compte Stripe déjà existant ? ----
    const { data: existing } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, onboarding_completed')
      .eq('praticien_id', praticien_id)
      .maybeSingle();

    let accountId: string;

    if (existing?.stripe_account_id) {
      accountId = existing.stripe_account_id;
    } else {
      const account = await stripe.accounts.create({
        country: 'FR',
        email: praticien.email,
        business_type: 'individual',
        controller: {
          stripe_dashboard: { type: 'express' },
          fees: { payer: 'application' },
          losses: { payments: 'application' },
          requirement_collection: 'stripe',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: `${praticien.prenom} ${praticien.nom}`,
          product_description: 'Séances de bien-être et accompagnement personnalisé via la plateforme Idala.',
        },
        metadata: {
          praticien_id: praticien.id,
          platform: 'idala',
        },
      });

      accountId = account.id;

      const { error: insErr } = await supabase
        .from('stripe_accounts')
        .insert({
          praticien_id: praticien.id,
          stripe_account_id: accountId,
          onboarding_completed: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        });

      if (insErr) {
        return jsonResponse({ error: 'Erreur enregistrement compte', details: insErr.message }, 500);
      }
    }

    // ---- Générer le lien d'onboarding ----
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return jsonResponse({
      stripe_account_id: accountId,
      onboarding_url: accountLink.url,
      expires_at: accountLink.expires_at,
    }, 200);

  } catch (err) {
    return jsonResponse({ error: 'Erreur serveur', details: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}