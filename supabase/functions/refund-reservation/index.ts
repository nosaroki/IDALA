import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';
const SITE_URL = 'https://theidalafamily.com';
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
    // IMPORTANT : SuperSaaS exige schedule_id sur le DELETE, sinon 404 (booking introuvable).
    if (session.supersaas_booking_id) {
      try {
        const { data: pratSched } = await supabase
          .from('praticiens')
          .select('supersaas_schedule_id')
          .eq('id', resa.praticien_id)
          .single();

        const params = new URLSearchParams({
          account: SUPERSAAS_ACCOUNT,
          api_key: SUPERSAAS_API_KEY,
        });
        if (pratSched?.supersaas_schedule_id) {
          params.set('schedule_id', String(pratSched.supersaas_schedule_id));
        }

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

    // ---- Mails d'annulation (client + praticien + Idala) ----
    try {
      const { data: praticienData } = await supabase
        .from('praticiens')
        .select('prenom, nom, email, langues')
        .eq('id', resa.praticien_id)
        .single();

      let pratiqueNom = 'Séance';
      {
        const { data: prq } = await supabase
          .from('pratiques').select('nom').eq('id', resa.pratique_id).single();
        if (prq?.nom) pratiqueNom = prq.nom;
      }

      await sendCancellationEmails({
        clientName: resa.client_name,
        clientEmail: resa.client_email,
        praticienPrenom: praticienData?.prenom ?? '',
        praticienNom: praticienData?.nom ?? '',
        praticienEmail: praticienData?.email ?? null,
        praticienLangues: praticienData?.langues ?? '',
        pratiqueNom,
        scheduledAt: session.scheduled_at,
        priceCents: resa.price_cents ?? 0,
        clientLang: resa.lang === 'en' ? 'en' : 'fr',
      });
    } catch (e) {
      console.error('Erreur envoi mails annulation:', String(e));
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

// ---------- Emails ----------
async function sendCancellationEmails(p: {
  clientName: string;
  clientEmail: string;
  praticienPrenom: string;
  praticienNom: string;
  praticienEmail: string | null;
  praticienLangues: string;
  pratiqueNom: string;
  scheduledAt: string;
  priceCents: number;
  clientLang: 'fr' | 'en';
}) {
  const startDate = new Date(p.scheduledAt);
  const fmtDate = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(startDate);
  const fmtTime = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit',
    }).format(startDate);

  const prixEuros = p.priceCents ? (p.priceCents / 100) : null;

  const wrap = (title: string, bodyHtml: string) => `
    <div style="margin:0;padding:0;background:#F0EAFA;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-family:Georgia,serif;font-size:22px;letter-spacing:2px;color:#3e295d;">The Idala Family</span>
        </div>
        <div style="background:#ffffff;border:1px solid #E4D8F5;border-radius:14px;padding:36px 32px;">
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;color:#3e295d;margin:0 0 20px;text-align:center;">${title}</h1>
          ${bodyHtml}
        </div>
        <p style="text-align:center;font-size:12px;color:#9B6EBF;margin-top:20px;font-style:italic;">Mens sana in corpore sano</p>
      </div>
    </div>`;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#281745;text-align:right;font-weight:500;">${value}</td>
    </tr>`;

  const send = (to: string, subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'The Idala Family <contact@theidalafamily.com>', to, subject, html }),
    });

  // Bouton "reprendre rendez-vous" vers l'accueil
  const rebookFr = `
    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}" style="display:inline-block;padding:12px 26px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Reprendre rendez-vous</a>
    </div>`;
  const rebookEn = `
    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}" style="display:inline-block;padding:12px 26px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Book again</a>
    </div>`;

  // ---- CLIENT ----
  const clientFr = wrap('Réservation annulée', `
    <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
      Bonjour ${p.clientName},<br/>votre séance a bien été annulée.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
      ${row('Séance', p.pratiqueNom)}
      ${row('Date', fmtDate('fr-FR'))}
      ${row('Heure', fmtTime('fr-FR'))}
      ${prixEuros !== null ? row('Remboursement', `${prixEuros} €`) : ''}
    </table>
    <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
      Le remboursement intégral a été initié. Le crédit apparaît sous cinq à dix jours ouvrés selon votre banque.
    </p>
    ${rebookFr}`);

  const clientEn = wrap('Booking cancelled', `
    <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
      Hello ${p.clientName},<br/>your session has been cancelled.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
      ${row('Session', p.pratiqueNom)}
      ${row('Date', fmtDate('en-GB'))}
      ${row('Time', fmtTime('en-GB'))}
      ${prixEuros !== null ? row('Refund', `${prixEuros} €`) : ''}
    </table>
    <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
      A full refund has been initiated. The credit appears within five to ten business days depending on your bank.
    </p>
    ${rebookEn}`);

  await send(
    p.clientEmail,
    p.clientLang === 'en' ? 'Your booking has been cancelled : The Idala Family' : 'Votre réservation a été annulée : The Idala Family',
    p.clientLang === 'en' ? clientEn : clientFr
  );

  // ---- PRATICIEN ----
  if (p.praticienEmail) {
    const pratLangues = (p.praticienLangues || '').toLowerCase();
    const pratLang = (pratLangues.includes('franç') || pratLangues.includes('french') || pratLangues === '') ? 'fr' : 'en';

    const pratFr = wrap('Séance annulée', `
      <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
        Bonjour ${p.praticienPrenom},<br/>un client a annulé sa séance.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
        ${row('Séance', p.pratiqueNom)}
        ${row('Client', p.clientName)}
        ${row('Date', fmtDate('fr-FR'))}
        ${row('Heure', fmtTime('fr-FR'))}
      </table>
      <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
        Le créneau est de nouveau libre dans votre agenda.
      </p>`);

    const pratEn = wrap('Session cancelled', `
      <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
        Hello ${p.praticienPrenom},<br/>a client has cancelled their session.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
        ${row('Session', p.pratiqueNom)}
        ${row('Client', p.clientName)}
        ${row('Date', fmtDate('en-GB'))}
        ${row('Time', fmtTime('en-GB'))}
      </table>
      <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
        The slot is available again in your calendar.
      </p>`);

    await send(
      p.praticienEmail,
      pratLang === 'en' ? 'A session has been cancelled : The Idala Family' : 'Une séance a été annulée : The Idala Family',
      pratLang === 'en' ? pratEn : pratFr
    );
  }

  // ---- IDALA (récap interne, toujours en français) ----
  const idalaHtml = wrap('Réservation annulée', `
    <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
      Une réservation a été annulée sur la plateforme.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
      ${row('Séance', p.pratiqueNom)}
      ${row('Praticien', `${p.praticienPrenom} ${p.praticienNom}`)}
      ${row('Client', p.clientName)}
      ${row('Email client', p.clientEmail)}
      ${row('Date', fmtDate('fr-FR'))}
      ${row('Heure', fmtTime('fr-FR'))}
      ${prixEuros !== null ? row('Montant remboursé', `${prixEuros} €`) : ''}
    </table>`);

  await send(
    'contact@theidalafamily.com',
    `Réservation annulée : ${p.pratiqueNom} - ${p.clientName}`,
    idalaHtml
  );
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// V2
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import Stripe from 'https://esm.sh/stripe@14?target=deno';

// const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
// const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
// const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
// const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;
// const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

// const DAILY_API_BASE = 'https://api.daily.co/v1';
// const SITE_URL = 'https://theidalafamily.com';
// const CANCEL_LIMIT_HOURS = 24;

// const stripe = new Stripe(STRIPE_SECRET_KEY, {
//   apiVersion: '2024-06-20',
//   httpClient: Stripe.createFetchHttpClient(),
// });

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// };

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const { cancel_token, action } = await req.json();

//     if (!cancel_token) {
//       return json({ error: 'MISSING_TOKEN' }, 400);
//     }

//     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

//     // ---- Retrouver la réservation via le token ----
//     const { data: resa, error: rErr } = await supabase
//       .from('reservations')
//       .select(`
//         id, status, cancelled_at, price_cents, commission_cents,
//         stripe_payment_intent_id, praticien_id, pratique_id, session_id, lang,
//         client_name, client_email,
//         sessions ( id, scheduled_at, booked_count, max_participants, mode_seance,
//                    daily_room_name, supersaas_booking_id, praticien_id )
//       `)
//       .eq('cancel_token', cancel_token)
//       .maybeSingle();

//     if (rErr || !resa) {
//       return json({ error: 'NOT_FOUND' }, 404);
//     }

//     const session = Array.isArray(resa.sessions) ? resa.sessions[0] : resa.sessions;

//     // ---- Déjà annulée ? ----
//     if (resa.status === 'cancelled' || resa.cancelled_at) {
//       return json({ error: 'ALREADY_CANCELLED' }, 409);
//     }

//     // ---- Calcul du délai avant séance ----
//     const scheduledAt = new Date(session.scheduled_at);
//     const now = new Date();
//     const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

//     // ---- Mode "vérification" : le front demande juste l'état, sans annuler ----
//     if (action === 'check') {
//       return json({
//         can_cancel: hoursUntil >= CANCEL_LIMIT_HOURS,
//         hours_until: Math.round(hoursUntil),
//         scheduled_at: session.scheduled_at,
//         client_name: resa.client_name,
//         price_cents: resa.price_cents,
//       }, 200);
//     }

//     // ---- Règle des 24h : refus si trop tard ----
//     if (hoursUntil < CANCEL_LIMIT_HOURS) {
//       return json({ error: 'TOO_LATE', hours_until: Math.round(hoursUntil) }, 403);
//     }

//     // ---- Remboursement Stripe (sur le compte connecté du praticien) ----
//     const { data: stripeAcc } = await supabase
//       .from('stripe_accounts')
//       .select('stripe_account_id')
//       .eq('praticien_id', resa.praticien_id)
//       .single();

//     if (!stripeAcc?.stripe_account_id) {
//       return json({ error: 'NO_STRIPE_ACCOUNT' }, 500);
//     }

//     // Remboursement total + remboursement de la commission Idala (application fee)
//     // conforme à la Convention Art. 7.2 (remboursement total = commission incluse)
//     let refundId: string | null = null;
//     try {
//       const refund = await stripe.refunds.create(
//         {
//           payment_intent: resa.stripe_payment_intent_id,
//           refund_application_fee: true,   // Idala rend sa commission
//           reverse_transfer: false,        // direct charge : pas de transfer à inverser
//         },
//         { stripeAccount: stripeAcc.stripe_account_id }
//       );
//       refundId = refund.id;
//     } catch (e) {
//       console.error('Erreur remboursement Stripe:', String(e));
//       return json({ error: 'REFUND_FAILED', details: String(e) }, 502);
//     }

//     // ---- Marquer la réservation annulée ----
//     await supabase
//       .from('reservations')
//       .update({
//         status: 'cancelled',
//         cancelled_at: new Date().toISOString(),
//         refund_amount_cents: resa.price_cents,
//       })
//       .eq('id', resa.id);

//     // ---- Libérer le créneau : décrémenter booked_count, rouvrir la session ----
//     const newCount = Math.max(0, (session.booked_count ?? 1) - 1);
//     await supabase
//       .from('sessions')
//       .update({
//         booked_count: newCount,
//         status: newCount === 0 ? 'cancelled' : 'open',
//       })
//       .eq('id', session.id);

//     // ---- Supprimer la réservation SuperSaaS (libère le créneau côté agenda) ----
//     // if (session.supersaas_booking_id) {
//     //   try {
//     //     const params = new URLSearchParams({
//     //       account: SUPERSAAS_ACCOUNT,
//     //       api_key: SUPERSAAS_API_KEY,
//     //     });
//     //     await fetch(
//     //       `https://www.supersaas.com/api/bookings/${session.supersaas_booking_id}.json?${params.toString()}`,
//     //       { method: 'DELETE' }
//     //     );
//     //   } catch (e) {
//     //     console.error('Erreur suppression booking SuperSaaS:', String(e));
//     //   }
//     // }
//     if (session.supersaas_booking_id) {
//           try {
//             const params = new URLSearchParams({
//               account: SUPERSAAS_ACCOUNT,
//               api_key: SUPERSAAS_API_KEY,
//             });
//             const delRes = await fetch(
//               `https://www.supersaas.com/api/bookings/${session.supersaas_booking_id}.json?${params.toString()}`,
//               { method: 'DELETE' }
//             );
//             console.log('SUPERSAAS DELETE status:', delRes.status);
//             console.log('SUPERSAAS DELETE body:', await delRes.text());
//           } catch (e) {
//             console.error('Erreur suppression booking SuperSaaS:', String(e));
//           }
//         }

//     // ---- Supprimer la room Daily si elle existe et que plus personne n'est inscrit ----
//     if (session.daily_room_name && newCount === 0) {
//       try {
//         await fetch(`${DAILY_API_BASE}/rooms/${session.daily_room_name}`, {
//           method: 'DELETE',
//           headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
//         });
//       } catch (e) {
//         console.error('Erreur suppression room Daily:', String(e));
//       }
//     }

//     // ---- Mails d'annulation (client + praticien + Idala) ----
//     try {
//       const { data: praticienData } = await supabase
//         .from('praticiens')
//         .select('prenom, nom, email, langues')
//         .eq('id', resa.praticien_id)
//         .single();

//       let pratiqueNom = 'Séance';
//       {
//         const { data: prq } = await supabase
//           .from('pratiques').select('nom').eq('id', resa.pratique_id).single();
//         if (prq?.nom) pratiqueNom = prq.nom;
//       }

//       await sendCancellationEmails({
//         clientName: resa.client_name,
//         clientEmail: resa.client_email,
//         praticienPrenom: praticienData?.prenom ?? '',
//         praticienNom: praticienData?.nom ?? '',
//         praticienEmail: praticienData?.email ?? null,
//         praticienLangues: praticienData?.langues ?? '',
//         pratiqueNom,
//         scheduledAt: session.scheduled_at,
//         priceCents: resa.price_cents ?? 0,
//         clientLang: resa.lang === 'en' ? 'en' : 'fr',
//       });
//     } catch (e) {
//       console.error('Erreur envoi mails annulation:', String(e));
//     }

//     return json({
//       success: true,
//       refund_id: refundId,
//       refunded_cents: resa.price_cents,
//     }, 200);

//   } catch (err) {
//     return json({ error: 'SERVER_ERROR', details: String(err) }, 500);
//   }
// });

// // ---------- Emails ----------
// async function sendCancellationEmails(p: {
//   clientName: string;
//   clientEmail: string;
//   praticienPrenom: string;
//   praticienNom: string;
//   praticienEmail: string | null;
//   praticienLangues: string;
//   pratiqueNom: string;
//   scheduledAt: string;
//   priceCents: number;
//   clientLang: 'fr' | 'en';
// }) {
//   const startDate = new Date(p.scheduledAt);
//   const fmtDate = (locale: string) =>
//     new Intl.DateTimeFormat(locale, {
//       timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
//     }).format(startDate);
//   const fmtTime = (locale: string) =>
//     new Intl.DateTimeFormat(locale, {
//       timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit',
//     }).format(startDate);

//   const prixEuros = p.priceCents ? (p.priceCents / 100) : null;

//   const wrap = (title: string, bodyHtml: string) => `
//     <div style="margin:0;padding:0;background:#F0EAFA;font-family:'Helvetica Neue',Arial,sans-serif;">
//       <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
//         <div style="text-align:center;margin-bottom:28px;">
//           <span style="font-family:Georgia,serif;font-size:22px;letter-spacing:2px;color:#3e295d;">The Idala Family</span>
//         </div>
//         <div style="background:#ffffff;border:1px solid #E4D8F5;border-radius:14px;padding:36px 32px;">
//           <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;color:#3e295d;margin:0 0 20px;text-align:center;">${title}</h1>
//           ${bodyHtml}
//         </div>
//         <p style="text-align:center;font-size:12px;color:#9B6EBF;margin-top:20px;font-style:italic;">Mens sana in corpore sano</p>
//       </div>
//     </div>`;

//   const row = (label: string, value: string) => `
//     <tr>
//       <td style="padding:8px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;">${label}</td>
//       <td style="padding:8px 0;font-size:14px;color:#281745;text-align:right;font-weight:500;">${value}</td>
//     </tr>`;

//   const send = (to: string, subject: string, html: string) =>
//     fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ from: 'The Idala Family <contact@theidalafamily.com>', to, subject, html }),
//     });

//   // Bouton "reprendre rendez-vous" vers l'accueil
//   const rebookFr = `
//     <div style="text-align:center;margin-top:24px;">
//       <a href="${SITE_URL}" style="display:inline-block;padding:12px 26px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Reprendre rendez-vous</a>
//     </div>`;
//   const rebookEn = `
//     <div style="text-align:center;margin-top:24px;">
//       <a href="${SITE_URL}" style="display:inline-block;padding:12px 26px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Book again</a>
//     </div>`;

//   // ---- CLIENT ----
//   const clientFr = wrap('Réservation annulée', `
//     <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
//       Bonjour ${p.clientName},<br/>votre séance a bien été annulée.
//     </p>
//     <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
//       ${row('Séance', p.pratiqueNom)}
//       ${row('Date', fmtDate('fr-FR'))}
//       ${row('Heure', fmtTime('fr-FR'))}
//       ${prixEuros !== null ? row('Remboursement', `${prixEuros} €`) : ''}
//     </table>
//     <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
//       Le remboursement intégral a été initié. Le crédit apparaît sous cinq à dix jours ouvrés selon votre banque.
//     </p>
//     ${rebookFr}`);

//   const clientEn = wrap('Booking cancelled', `
//     <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
//       Hello ${p.clientName},<br/>your session has been cancelled.
//     </p>
//     <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
//       ${row('Session', p.pratiqueNom)}
//       ${row('Date', fmtDate('en-GB'))}
//       ${row('Time', fmtTime('en-GB'))}
//       ${prixEuros !== null ? row('Refund', `${prixEuros} €`) : ''}
//     </table>
//     <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
//       A full refund has been initiated. The credit appears within five to ten business days depending on your bank.
//     </p>
//     ${rebookEn}`);

//   await send(
//     p.clientEmail,
//     p.clientLang === 'en' ? 'Your booking has been cancelled : The Idala Family' : 'Votre réservation a été annulée : The Idala Family',
//     p.clientLang === 'en' ? clientEn : clientFr
//   );

//   // ---- PRATICIEN ----
//   if (p.praticienEmail) {
//     const pratLangues = (p.praticienLangues || '').toLowerCase();
//     const pratLang = (pratLangues.includes('franç') || pratLangues.includes('french') || pratLangues === '') ? 'fr' : 'en';

//     const pratFr = wrap('Séance annulée', `
//       <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
//         Bonjour ${p.praticienPrenom},<br/>un client a annulé sa séance.
//       </p>
//       <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
//         ${row('Séance', p.pratiqueNom)}
//         ${row('Client', p.clientName)}
//         ${row('Date', fmtDate('fr-FR'))}
//         ${row('Heure', fmtTime('fr-FR'))}
//       </table>
//       <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
//         Le créneau est de nouveau libre dans votre agenda.
//       </p>`);

//     const pratEn = wrap('Session cancelled', `
//       <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
//         Hello ${p.praticienPrenom},<br/>a client has cancelled their session.
//       </p>
//       <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
//         ${row('Session', p.pratiqueNom)}
//         ${row('Client', p.clientName)}
//         ${row('Date', fmtDate('en-GB'))}
//         ${row('Time', fmtTime('en-GB'))}
//       </table>
//       <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
//         The slot is available again in your calendar.
//       </p>`);

//     await send(
//       p.praticienEmail,
//       pratLang === 'en' ? 'A session has been cancelled : The Idala Family' : 'Une séance a été annulée : The Idala Family',
//       pratLang === 'en' ? pratEn : pratFr
//     );
//   }

//   // ---- IDALA (récap interne, toujours en français) ----
//   const idalaHtml = wrap('Réservation annulée', `
//     <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
//       Une réservation a été annulée sur la plateforme.
//     </p>
//     <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
//       ${row('Séance', p.pratiqueNom)}
//       ${row('Praticien', `${p.praticienPrenom} ${p.praticienNom}`)}
//       ${row('Client', p.clientName)}
//       ${row('Email client', p.clientEmail)}
//       ${row('Date', fmtDate('fr-FR'))}
//       ${row('Heure', fmtTime('fr-FR'))}
//       ${prixEuros !== null ? row('Montant remboursé', `${prixEuros} €`) : ''}
//     </table>`);

//   await send(
//     'contact@theidalafamily.com',
//     `Réservation annulée : ${p.pratiqueNom} - ${p.clientName}`,
//     idalaHtml
//   );
// }

// function json(body: unknown, status: number) {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   });
// }

// V1
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import Stripe from 'https://esm.sh/stripe@14?target=deno';

// const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
// const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
// const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
// const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

// const DAILY_API_BASE = 'https://api.daily.co/v1';
// const CANCEL_LIMIT_HOURS = 24;

// const stripe = new Stripe(STRIPE_SECRET_KEY, {
//   apiVersion: '2024-06-20',
//   httpClient: Stripe.createFetchHttpClient(),
// });

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// };

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const { cancel_token, action } = await req.json();

//     if (!cancel_token) {
//       return json({ error: 'MISSING_TOKEN' }, 400);
//     }

//     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

//     // ---- Retrouver la réservation via le token ----
//     const { data: resa, error: rErr } = await supabase
//       .from('reservations')
//       .select(`
//         id, status, cancelled_at, price_cents, commission_cents,
//         stripe_payment_intent_id, praticien_id, pratique_id, session_id, lang,
//         client_name, client_email,
//         sessions ( id, scheduled_at, booked_count, max_participants, mode_seance,
//                    daily_room_name, supersaas_booking_id, praticien_id )
//       `)
//       .eq('cancel_token', cancel_token)
//       .maybeSingle();

//     if (rErr || !resa) {
//       return json({ error: 'NOT_FOUND' }, 404);
//     }

//     const session = Array.isArray(resa.sessions) ? resa.sessions[0] : resa.sessions;

//     // ---- Déjà annulée ? ----
//     if (resa.status === 'cancelled' || resa.cancelled_at) {
//       return json({ error: 'ALREADY_CANCELLED' }, 409);
//     }

//     // ---- Calcul du délai avant séance ----
//     const scheduledAt = new Date(session.scheduled_at);
//     const now = new Date();
//     const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

//     // ---- Mode "vérification" : le front demande juste l'état, sans annuler ----
//     if (action === 'check') {
//       return json({
//         can_cancel: hoursUntil >= CANCEL_LIMIT_HOURS,
//         hours_until: Math.round(hoursUntil),
//         scheduled_at: session.scheduled_at,
//         client_name: resa.client_name,
//         price_cents: resa.price_cents,
//       }, 200);
//     }

//     // ---- Règle des 24h : refus si trop tard ----
//     if (hoursUntil < CANCEL_LIMIT_HOURS) {
//       return json({ error: 'TOO_LATE', hours_until: Math.round(hoursUntil) }, 403);
//     }

//     // ---- Remboursement Stripe (sur le compte connecté du praticien) ----
//     // On récupère le compte Stripe du praticien
//     const { data: stripeAcc } = await supabase
//       .from('stripe_accounts')
//       .select('stripe_account_id')
//       .eq('praticien_id', resa.praticien_id)
//       .single();

//     if (!stripeAcc?.stripe_account_id) {
//       return json({ error: 'NO_STRIPE_ACCOUNT' }, 500);
//     }

//     // Remboursement total + remboursement de la commission Idala (application fee)
//     // conforme à la Convention Art. 7.2 (remboursement total = commission incluse)
//     let refundId: string | null = null;
//     try {
//       const refund = await stripe.refunds.create(
//         {
//           payment_intent: resa.stripe_payment_intent_id,
//           refund_application_fee: true,   // Idala rend sa commission
//           reverse_transfer: false,        // direct charge : pas de transfer à inverser
//         },
//         { stripeAccount: stripeAcc.stripe_account_id }
//       );
//       refundId = refund.id;
//     } catch (e) {
//       console.error('Erreur remboursement Stripe:', String(e));
//       return json({ error: 'REFUND_FAILED', details: String(e) }, 502);
//     }

//     // ---- Marquer la réservation annulée ----
//     await supabase
//       .from('reservations')
//       .update({
//         status: 'cancelled',
//         cancelled_at: new Date().toISOString(),
//         refund_amount_cents: resa.price_cents,
//       })
//       .eq('id', resa.id);

//     // ---- Libérer le créneau : décrémenter booked_count, rouvrir la session ----
//     const newCount = Math.max(0, (session.booked_count ?? 1) - 1);
//     await supabase
//       .from('sessions')
//       .update({
//         booked_count: newCount,
//         status: newCount === 0 ? 'cancelled' : 'open',
//       })
//       .eq('id', session.id);

//     // ---- Supprimer la réservation SuperSaaS (libère le créneau côté agenda) ----
//     if (session.supersaas_booking_id) {
//       try {
//         const params = new URLSearchParams({
//           account: SUPERSAAS_ACCOUNT,
//           api_key: SUPERSAAS_API_KEY,
//         });
//         await fetch(
//           `https://www.supersaas.com/api/bookings/${session.supersaas_booking_id}.json?${params.toString()}`,
//           { method: 'DELETE' }
//         );
//       } catch (e) {
//         console.error('Erreur suppression booking SuperSaaS:', String(e));
//       }
//     }

//     // ---- Supprimer la room Daily si elle existe et que plus personne n'est inscrit ----
//     if (session.daily_room_name && newCount === 0) {
//       try {
//         await fetch(`${DAILY_API_BASE}/rooms/${session.daily_room_name}`, {
//           method: 'DELETE',
//           headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
//         });
//       } catch (e) {
//         console.error('Erreur suppression room Daily:', String(e));
//       }
//     }

//     return json({
//       success: true,
//       refund_id: refundId,
//       refunded_cents: resa.price_cents,
//     }, 200);

//   } catch (err) {
//     return json({ error: 'SERVER_ERROR', details: String(err) }, 500);
//   }
// });

// function json(body: unknown, status: number) {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   });
// }