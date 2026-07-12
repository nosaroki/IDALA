import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';
const MODIFY_LIMIT_HOURS = 24;
const OPEN_BEFORE_MIN = 15;
const MARGIN_AFTER_MIN = 60;

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
    const { cancel_token, action, new_start } = await req.json();

    if (!cancel_token) {
      return json({ error: 'MISSING_TOKEN' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Retrouver la réservation via le token ----
    const { data: resa, error: rErr } = await supabase
      .from('reservations')
      .select(`
        id, status, cancelled_at, price_cents, lang,
        praticien_id, pratique_id, session_id,
        client_name, client_email,
        sessions ( id, scheduled_at, duration_minutes, booked_count, max_participants,
                   mode_seance, daily_room_name, supersaas_booking_id, praticien_id )
      `)
      .eq('cancel_token', cancel_token)
      .maybeSingle();

    if (rErr || !resa) {
      return json({ error: 'NOT_FOUND' }, 404);
    }

    const session = Array.isArray(resa.sessions) ? resa.sessions[0] : resa.sessions;

    if (resa.status === 'cancelled' || resa.cancelled_at) {
      return json({ error: 'ALREADY_CANCELLED' }, 409);
    }

    // ---- Délai avant l'ANCIENNE séance ----
    const oldScheduledAt = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntil = (oldScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // ---- Mode "check" : le front demande l'état + les infos pour afficher ----
    if (action === 'check') {
      return json({
        can_modify: hoursUntil >= MODIFY_LIMIT_HOURS,
        hours_until: Math.round(hoursUntil),
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        praticien_id: resa.praticien_id,
        pratique_id: resa.pratique_id,
        client_name: resa.client_name,
        lang: resa.lang,
      }, 200);
    }

    // ---- Pour une vraie modification, il faut le nouveau créneau ----
    if (!new_start) {
      return json({ error: 'MISSING_NEW_SLOT' }, 400);
    }

    // ---- Règle des 24h ----
    if (hoursUntil < MODIFY_LIMIT_HOURS) {
      return json({ error: 'TOO_LATE', hours_until: Math.round(hoursUntil) }, 403);
    }

    // ---- Vérifier que le NOUVEAU créneau est bien libre chez le praticien ----
    const { data: prat } = await supabase
      .from('praticiens')
      .select('supersaas_schedule_id, prenom, nom, email, langues')
      .eq('id', resa.praticien_id)
      .single();

    const scheduleId = prat?.supersaas_schedule_id;
    const durationMin = session.duration_minutes ?? 60;

    if (scheduleId) {
      // On interroge les créneaux libres autour du nouveau start
      const fromCheck = new Date(new Date(new_start).getTime() - 60 * 1000);
      const params = new URLSearchParams({
        account: SUPERSAAS_ACCOUNT,
        api_key: SUPERSAAS_API_KEY,
        schedule_id: scheduleId,
        from: toSuperSaasDate(fromCheck),
        maxresults: '50',
      });
      if (durationMin) params.set('length', String(durationMin));

      const freeRes = await fetch(
        `https://www.supersaas.com/api/free/${scheduleId}.json?${params.toString()}`
      );
      if (freeRes.ok) {
        const freeData = await freeRes.json();
        const freeSlots = (freeData.slots || []) as { start: string }[];
        const wanted = new Date(new_start).getTime();
        const isFree = freeSlots.some(s => Math.abs(new Date(s.start).getTime() - wanted) < 60 * 1000);
        if (!isFree) {
          return json({ error: 'SLOT_TAKEN' }, 409);
        }
      }
    }

    // ---- Libérer l'ANCIEN booking SuperSaaS ----
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
        console.error('Erreur suppression ancien booking SuperSaaS:', String(e));
      }
    }

    // ---- Supprimer l'ANCIENNE room Daily (calée sur l'ancien horaire) ----
    if (session.daily_room_name) {
      try {
        await fetch(`${DAILY_API_BASE}/rooms/${session.daily_room_name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
        });
      } catch (e) {
        console.error('Erreur suppression ancienne room Daily:', String(e));
      }
    }

    // ---- Créer le NOUVEAU booking SuperSaaS ----
    let newBookingId: string | null = null;
    let pratiqueNom = 'Séance';
    {
      const { data: prq } = await supabase
        .from('pratiques').select('nom').eq('id', resa.pratique_id).single();
      if (prq?.nom) pratiqueNom = prq.nom;
    }

    if (scheduleId) {
      try {
        const startDate = new Date(new_start);
        const finishDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
        const libelle = `${pratiqueNom} ${session.mode_seance} - ${resa.client_name}`;
        const params = new URLSearchParams({
          account: SUPERSAAS_ACCOUNT,
          api_key: SUPERSAAS_API_KEY,
        });
        const bookingRes = await fetch(
          `https://www.supersaas.com/api/bookings.json?${params.toString()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schedule_id: scheduleId,
              booking: {
                start: fmtSuperSaas(startDate),
                finish: fmtSuperSaas(finishDate),
                full_name: resa.client_name,
                email: resa.client_email,
                description: libelle,
              },
            }),
          }
        );
        if (bookingRes.ok) {
          try {
            const bd = await bookingRes.json();
            newBookingId = String(bd.id || bd.booking_id || '');
          } catch {
            const loc = bookingRes.headers.get('Location');
            const match = loc?.match(/(\d+)\.json/);
            if (match) newBookingId = match[1];
          }
        } else {
          console.error('Erreur création nouveau booking SuperSaaS:', await bookingRes.text());
        }
      } catch (e) {
        console.error('Exception création nouveau booking SuperSaaS:', String(e));
      }
    }

    // ---- Créer la NOUVELLE room Daily si visio (calée sur le nouvel horaire) ----
    let newRoomName: string | null = null;
    let newRoomUrl: string | null = null;
    let newRoomExp: string | null = null;

    if (session.mode_seance === 'visio') {
      try {
        const scheduledAt = new Date(new_start);
        const nbf = Math.floor((scheduledAt.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000);
        const exp = Math.floor((scheduledAt.getTime() + (durationMin + MARGIN_AFTER_MIN) * 60 * 1000) / 1000);
        const roomCapacity = (session.max_participants ?? 1) + 1;
        const roomName = `idala-${session.id.slice(0, 8)}-${Date.now().toString(36)}`;

        const roomRes = await fetch(`${DAILY_API_BASE}/rooms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'private',
            properties: {
              nbf, exp,
              enable_chat: true,
              enable_screenshare: true,
              enable_knocking: false,
              max_participants: roomCapacity,
              eject_at_room_exp: true,
            },
          }),
        });
        if (roomRes.ok) {
          const room = await roomRes.json();
          newRoomName = room.name;
          newRoomUrl = room.url;
          newRoomExp = new Date(exp * 1000).toISOString();
        } else {
          console.error('Erreur création nouvelle room Daily:', await roomRes.text());
        }
      } catch (e) {
        console.error('Exception création nouvelle room Daily:', String(e));
      }
    }

    // ---- Mettre à jour la SESSION avec le nouvel horaire ----
    await supabase
      .from('sessions')
      .update({
        scheduled_at: new_start,
        supersaas_booking_id: newBookingId,
        daily_room_name: newRoomName,
        daily_room_url: newRoomUrl,
        daily_room_expires_at: newRoomExp,
        status: 'open',
      })
      .eq('id', session.id);

    // ---- Mail de confirmation de modification ----
    try {
      await sendModificationEmails({
        clientName: resa.client_name,
        clientEmail: resa.client_email,
        praticienPrenom: prat?.prenom ?? '',
        praticienEmail: prat?.email ?? null,
        praticienLangues: prat?.langues ?? '',
        pratiqueNom,
        newStart: new_start,
        modeSeance: session.mode_seance,
        clientLang: resa.lang === 'en' ? 'en' : 'fr',
      });
    } catch (e) {
      console.error('Erreur envoi mails modification:', String(e));
    }

    return json({
      success: true,
      new_scheduled_at: new_start,
    }, 200);

  } catch (err) {
    return json({ error: 'SERVER_ERROR', details: String(err) }, 500);
  }
});

// ---------- Emails ----------
async function sendModificationEmails(p: {
  clientName: string;
  clientEmail: string;
  praticienPrenom: string;
  praticienEmail: string | null;
  praticienLangues: string;
  pratiqueNom: string;
  newStart: string;
  modeSeance: string;
  clientLang: 'fr' | 'en';
}) {
  const startDate = new Date(p.newStart);
  const fmtDate = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(startDate);
  const fmtTime = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit',
    }).format(startDate);

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

  // CLIENT
  const clientFr = wrap('Rendez-vous modifié', `
    <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
      Bonjour ${p.clientName},<br/>votre rendez-vous a bien été déplacé.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
      ${row('Séance', p.pratiqueNom)}
      ${row('Nouvelle date', fmtDate('fr-FR'))}
      ${row('Heure', fmtTime('fr-FR'))}
    </table>
    <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
      ${p.modeSeance === 'visio'
        ? 'Le lien de connexion vous sera envoyé peu avant le nouveau rendez-vous.'
        : 'Vous recevrez un rappel avant votre rendez-vous.'}
    </p>`);

  const clientEn = wrap('Appointment updated', `
    <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
      Hello ${p.clientName},<br/>your appointment has been rescheduled.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
      ${row('Session', p.pratiqueNom)}
      ${row('New date', fmtDate('en-GB'))}
      ${row('Time', fmtTime('en-GB'))}
    </table>
    <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
      ${p.modeSeance === 'visio'
        ? 'The connection link will be sent to you shortly before the new appointment.'
        : 'You will receive a reminder before your appointment.'}
    </p>`);

  await send(
    p.clientEmail,
    p.clientLang === 'en' ? 'Your appointment has been updated : The Idala Family' : 'Votre rendez-vous a été modifié : The Idala Family',
    p.clientLang === 'en' ? clientEn : clientFr
  );

  // PRATICIEN
  if (p.praticienEmail) {
    const pratLangues = (p.praticienLangues || '').toLowerCase();
    const pratLang = (pratLangues.includes('franç') || pratLangues.includes('french') || pratLangues === '') ? 'fr' : 'en';

    const pratFr = wrap('Rendez-vous modifié', `
      <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
        Bonjour ${p.praticienPrenom},<br/>un client a déplacé son rendez-vous.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
        ${row('Séance', p.pratiqueNom)}
        ${row('Client', p.clientName)}
        ${row('Nouvelle date', fmtDate('fr-FR'))}
        ${row('Heure', fmtTime('fr-FR'))}
      </table>`);

    const pratEn = wrap('Appointment updated', `
      <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
        Hello ${p.praticienPrenom},<br/>a client has rescheduled their appointment.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
        ${row('Session', p.pratiqueNom)}
        ${row('Client', p.clientName)}
        ${row('New date', fmtDate('en-GB'))}
        ${row('Time', fmtTime('en-GB'))}
      </table>`);

    await send(
      p.praticienEmail,
      pratLang === 'en' ? 'A booking has been rescheduled : The Idala Family' : 'Un rendez-vous a été modifié : The Idala Family',
      pratLang === 'en' ? pratEn : pratFr
    );
  }
}

function toSuperSaasDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtSuperSaas(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}