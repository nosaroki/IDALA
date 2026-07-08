import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';
const CANCEL_LIMIT_HOURS = 24;

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
    const { cancel_token, action } = await req.json();

    if (!cancel_token) {
      return json({ error: 'MISSING_TOKEN' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Retrouver la réservation via le token ----
    const { data: resa, error: rErr } = await supabase
      .from('reservations')
      .select(`
        id, status, cancelled_at, price_cents, commission_cents,
        stripe_payment_intent_id, praticien_id, pratique_id, session_id, lang,
        client_name, client_email,
        sessions ( id, scheduled_at, booked_count, max_participants, mode_seance,
                   daily_room_name, supersaas_booking_id, praticien_id )
      `)
      .eq('cancel_token', cancel_token)
      .maybeSingle();

    if (rErr || !resa) {
      return json({ error: 'NOT_FOUND' }, 404);
    }

    const session = Array.isArray(resa.sessions) ? resa.sessions[0] : resa.sessions;

    // ---- Déjà annulée ? ----
    if (resa.status === 'cancelled' || resa.cancelled_at) {
      return json({ error: 'ALREADY_CANCELLED' }, 409);
    }

    // ---- Calcul du délai avant séance ----
    const scheduledAt = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // ---- Mode "vérification" : le front demande juste l'état, sans annuler ----
    if (action === 'check') {
      return json({
        can_cancel: hoursUntil >= CANCEL_LIMIT_HOURS,
        hours_until: Math.round(hoursUntil),
        scheduled_at: session.scheduled_at,
        client_name: resa.client_name,
        price_cents: resa.price_cents,
      }, 200);
    }

    // ---- Règle des 24h : refus si trop tard ----
    if (hoursUntil < CANCEL_LIMIT_HOURS) {
      return json({ error: 'TOO_LATE', hours_until: Math.round(hoursUntil) }, 403);
    }

    // ---- Remboursement Stripe (sur le compte connecté du praticien) ----
    // On récupère le compte Stripe du praticien
    const { data: stripeAcc } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('praticien_id', resa.praticien_id)
      .single();

    if (!stripeAcc?.stripe_account_id) {
      return json({ error: 'NO_STRIPE_ACCOUNT' }, 500);
    }

    // Remboursement total + remboursement de la commission Idala (application fee)
    // conforme à la Convention Art. 7.2 (remboursement total = commission incluse)
    let refundId: string | null = null;
    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: resa.stripe_payment_intent_id,
          refund_application_fee: true,   // Idala rend sa commission
          reverse_transfer: false,        // direct charge : pas de transfer à inverser
        },
        { stripeAccount: stripeAcc.stripe_account_id }
      );
      refundId = refund.id;
    } catch (e) {
      console.error('Erreur remboursement Stripe:', String(e));
      return json({ error: 'REFUND_FAILED', details: String(e) }, 502);
    }

    // ---- Marquer la réservation annulée ----
    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        refund_amount_cents: resa.price_cents,
      })
      .eq('id', resa.id);

    // ---- Libérer le créneau : décrémenter booked_count, rouvrir la session ----
    const newCount = Math.max(0, (session.booked_count ?? 1) - 1);
    await supabase
      .from('sessions')
      .update({
        booked_count: newCount,
        status: newCount === 0 ? 'cancelled' : 'open',
      })
      .eq('id', session.id);

    // ---- Supprimer la réservation SuperSaaS (libère le créneau côté agenda) ----
    if (session.supersaas_booking_id) {
      try {
        const params = new URLSearchParams({
          account: SUPERSAAS_ACCOUNT,
          api_key: SUPERSAAS_API_KEY,
        });
        await fetch(
          `https://www.supersaas.com/api/bookings/${session.supersaas_booking_id}.json?${params.toString()}`,
          { method: 'DELETE' }
        );
      } catch (e) {
        console.error('Erreur suppression booking SuperSaaS:', String(e));
      }
    }

    // ---- Supprimer la room Daily si elle existe et que plus personne n'est inscrit ----
    if (session.daily_room_name && newCount === 0) {
      try {
        await fetch(`${DAILY_API_BASE}/rooms/${session.daily_room_name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
        });
      } catch (e) {
        console.error('Erreur suppression room Daily:', String(e));
      }
    }

    return json({
      success: true,
      refund_id: refundId,
      refunded_cents: resa.price_cents,
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