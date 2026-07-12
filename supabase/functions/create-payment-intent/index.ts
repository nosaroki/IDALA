import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

// Commission Idala : 15%
const PLATFORM_FEE_PERCENT = 15;

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
    const {
      praticien_id,
      pratique_id,
      scheduled_at,
      client_name,
      client_email,
      lang,
    } = await req.json();

    // ---- Validation des entrées ----
    if (!praticien_id || !pratique_id || !scheduled_at || !client_name || !client_email) {
      return jsonResponse({ error: 'Champs requis manquants' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- 1. Recalculer le PRIX depuis la base (jamais depuis le front) ----
    const { data: pp, error: ppErr } = await supabase
      .from('praticien_pratiques')
      .select('prix, duree_seance, max_participants, mode_seance')
      .eq('praticien_id', praticien_id)
      .eq('pratique_id', pratique_id)
      .single();

    if (ppErr || !pp) {
      return jsonResponse({ error: 'Prestation introuvable pour ce praticien' }, 404);
    }
    if (!pp.prix || pp.prix <= 0) {
      return jsonResponse({ error: 'Prix invalide pour cette prestation' }, 400);
    }

    // Prix en centimes (Stripe travaille en centimes)
    const priceCents = Math.round(Number(pp.prix) * 100);
    const feeCents = Math.round(priceCents * PLATFORM_FEE_PERCENT / 100);

    // ---- 2. Vérifier que le praticien peut ENCAISSER ----
    const { data: stripeAccount, error: saErr } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('praticien_id', praticien_id)
      .single();

    if (saErr || !stripeAccount) {
      return jsonResponse({ error: 'Le praticien n\'a pas de compte de paiement configuré' }, 400);
    }
    if (!stripeAccount.charges_enabled) {
      return jsonResponse({
        error: 'PRACTITIONER_NOT_READY',
        message: 'Ce praticien ne peut pas encore recevoir de paiements.',
      }, 403);
    }

    // ---- 2bis. Vérifier que le CRÉNEAU est toujours LIBRE ----
    // Évite qu'un client paie un créneau réservé entre-temps par quelqu'un d'autre.
    const { data: prat } = await supabase
      .from('praticiens')
      .select('supersaas_schedule_id')
      .eq('id', praticien_id)
      .single();

    if (prat?.supersaas_schedule_id) {
      const durationMin = pp.duree_seance ? parseInt(String(pp.duree_seance), 10) : 60;
      const wantedTime = new Date(scheduled_at).getTime();
      const fromCheck = new Date(wantedTime - 60 * 1000);

      const params = new URLSearchParams({
        account: SUPERSAAS_ACCOUNT,
        api_key: SUPERSAAS_API_KEY,
        schedule_id: prat.supersaas_schedule_id,
        from: toSuperSaasDate(fromCheck),
        maxresults: '50',
      });
      if (durationMin) params.set('length', String(durationMin));

      try {
        const freeRes = await fetch(
          `https://www.supersaas.com/api/free/${prat.supersaas_schedule_id}.json?${params.toString()}`
        );
        if (freeRes.ok) {
          const freeData = await freeRes.json();
          const freeSlots = (freeData.slots || []) as { start: string }[];
          const isFree = freeSlots.some(
            s => Math.abs(new Date(s.start).getTime() - wantedTime) < 60 * 1000
          );
          if (!isFree) {
            return jsonResponse({ error: 'SLOT_TAKEN' }, 409);
          }
        }
        // Si l'appel SuperSaaS échoue, on n'empêche pas le paiement :
        // le webhook a sa propre protection anti-collision (session full).
      } catch (e) {
        console.error('Erreur vérification créneau SuperSaaS:', String(e));
      }
    }

    // ---- 3. Créer le PaymentIntent en DIRECT CHARGE + application_fee ----
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: priceCents,
        currency: 'eur',
        application_fee_amount: feeCents,
        automatic_payment_methods: { enabled: true },
        metadata: {
          praticien_id,
          pratique_id,
          scheduled_at,
          client_name,
          client_email,
          lang: lang ?? 'fr',
          duree_seance: String(pp.duree_seance ?? ''),
          max_participants: String(pp.max_participants ?? 1),
          mode_seance: pp.mode_seance ?? 'visio',
          price_cents: String(priceCents),
          fee_cents: String(feeCents),
          platform: 'idala',
        },
      },
      {
        stripeAccount: stripeAccount.stripe_account_id,
      }
    );

    return jsonResponse({
      client_secret: paymentIntent.client_secret,
      amount: priceCents,
      fee: feeCents,
      currency: 'eur',
      stripe_account_id: stripeAccount.stripe_account_id,
    }, 200);

  } catch (err) {
    return jsonResponse({ error: 'Erreur serveur', details: String(err) }, 500);
  }
});

function toSuperSaasDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}