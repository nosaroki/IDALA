import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

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
      offre_id,
      scheduled_at,
      client_name,
      client_email,
      lang,
    } = await req.json();

    // ---- Validation des entrees ----
    if (!praticien_id || !pratique_id || !offre_id || !scheduled_at || !client_name || !client_email) {
      return jsonResponse({ error: 'Champs requis manquants' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- 1. Recalculer le PRIX depuis la base (jamais depuis le front) ----
    const { data: offre, error: offreErr } = await supabase
      .from('praticien_offres')
      .select('prix, duree, max_participants, mode_seance, praticien_pratiques(praticien_id, pratique_id)')
      .eq('id', offre_id)
      .single();

    if (offreErr || !offre) {
      return jsonResponse({ error: 'Offre introuvable' }, 404);
    }

    const ppRel = Array.isArray(offre.praticien_pratiques)
      ? offre.praticien_pratiques[0]
      : offre.praticien_pratiques;
    if (!ppRel || ppRel.praticien_id !== praticien_id || ppRel.pratique_id !== pratique_id) {
      return jsonResponse({ error: 'Offre incoherente avec le praticien' }, 400);
    }

    if (!offre.prix || offre.prix <= 0) {
      return jsonResponse({ error: 'Prix invalide pour cette offre' }, 400);
    }
    if (!offre.mode_seance) {
      return jsonResponse({ error: 'Mode de seance manquant pour cette offre' }, 400);
    }

    const priceCents = Math.round(Number(offre.prix) * 100);
    // Les frais (feeCents) sont calcules plus bas, une fois le taux de commission
    // du praticien lu en base. On ne les calcule plus ici avec un taux fixe.

    // ---- 2. Verifier que le praticien peut ENCAISSER ----
    const { data: stripeAccount, error: saErr } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('praticien_id', praticien_id)
      .single();

    if (saErr || !stripeAccount) {
      return jsonResponse({ error: 'Le praticien n\'a pas de compte de paiement configure' }, 400);
    }
    if (!stripeAccount.charges_enabled) {
      return jsonResponse({
        error: 'PRACTITIONER_NOT_READY',
        message: 'Ce praticien ne peut pas encore recevoir de paiements.',
      }, 403);
    }

    // ---- 2bis. Lire le praticien : agenda + taux de commission ----
    const { data: prat } = await supabase
      .from('praticiens')
      .select('supersaas_schedule_id, commission_rate')
      .eq('id', praticien_id)
      .single();

    // Taux de commission du praticien, lu en base. Defaut 0.15 si absent.
    // commission_rate est stocke en fraction : 0.15 = 15%, 0 = aucune commission.
    const commissionRate = prat?.commission_rate != null ? Number(prat.commission_rate) : 0.15;

    // Frais preleves par Idala, calcules avec le taux du praticien.
    // Diane a 0 donnera feeCents = 0, donc elle encaisse l'integralite.
    const feeCents = Math.round(priceCents * commissionRate);

    // ---- 2ter. Verifier que le CRENEAU est toujours LIBRE ----
    // IMPORTANT : ici on compare en heure BRUTE de Paris des deux cotes (scheduled_at
    // recu du front et creneaux libres de SuperSaaS). On ne convertit surtout PAS ici,
    // sinon la comparaison se desynchronise.
    if (prat?.supersaas_schedule_id) {
      const durationMin = offre.duree ? parseInt(String(offre.duree), 10) : 60;
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
      } catch (e) {
        console.error('Erreur verification creneau SuperSaaS:', String(e));
      }
    }

    // ---- 3. Convertir le creneau (heure de Paris) en instant UTC ----
    // C'est le SEUL endroit ou on convertit : la valeur devient un vrai instant,
    // stockee telle quelle par le webhook. Tout le reste en aval formate en Europe/Paris.
    const scheduledAtUTC = parisToUTC(scheduled_at);

    // ---- 4. Creer le PaymentIntent en DIRECT CHARGE + application_fee ----
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: priceCents,
        currency: 'eur',
        application_fee_amount: feeCents,
        automatic_payment_methods: { enabled: true },
        metadata: {
          praticien_id,
          pratique_id,
          offre_id: String(offre_id),
          scheduled_at: scheduledAtUTC,
          client_name,
          client_email,
          lang: lang ?? 'fr',
          duree_seance: String(offre.duree ?? ''),
          max_participants: String(offre.max_participants ?? 1),
          mode_seance: offre.mode_seance,
          price_cents: String(priceCents),
          fee_cents: String(feeCents),
          commission_rate: String(commissionRate),
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

// Convertit une heure locale de Paris ("2026-07-16T19:30") en instant UTC ISO.
// Calcule le decalage reel de Paris pour la date (ete +02:00, hiver +01:00).
function parisToUTC(local: string): string {
  const clean = local.replace(' ', 'T').slice(0, 16);
  const guess = new Date(clean + ':00Z');
  const parisShown = new Date(guess.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const utcShown = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = parisShown.getTime() - utcShown.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

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