import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const DIAGNOSTIC_SCHEDULE_ID = '840661';
const DIAGNOSTIC_DURATION_MIN = 20;
const DAILY_API_BASE = 'https://api.daily.co/v1';
const OPEN_BEFORE_MIN = 10;
const MARGIN_AFTER_MIN = 30;
const LOGO_URL = 'https://qpdevexolzjqeyjjehjf.supabase.co/storage/v1/object/public/assets/newlogo.png';

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
    const { scheduled_at, client_name, client_email, client_phone, besoin, mode, lang } = await req.json();

    if (!scheduled_at || !client_name || !client_email || !mode) {
      return json({ error: 'MISSING_FIELDS' }, 400);
    }
    if (mode === 'whatsapp' && !client_phone) {
      return json({ error: 'PHONE_REQUIRED' }, 400);
    }

    const clientLang = lang === 'en' ? 'en' : 'fr';

    // ---- Convertir le créneau (heure de Paris) en instant UTC ----
    // Même mécanisme que le tunnel : le front envoie une heure de Paris SANS fuseau
    // ("2026-07-16T19:30"). C'est le SEUL endroit où on convertit. Ensuite fmt, la room
    // Daily et les mails formatent tous en Europe/Paris et retombent sur la bonne heure.
    const scheduledAtUTC = parisToUTC(scheduled_at);
    const startDate = new Date(scheduledAtUTC);
    const finishDate = new Date(startDate.getTime() + DIAGNOSTIC_DURATION_MIN * 60 * 1000);

    // Format SuperSaaS en heure de Paris
    const fmt = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
      const hour = get('hour') === '24' ? '00' : get('hour');
      return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
    };

    // ---- Créer le rendez-vous dans SuperSaaS ----
    const modeLabel = mode === 'visio' ? 'Visio' : 'WhatsApp';
    const libelle = `Diagnostic ${modeLabel} - ${client_name}${client_phone ? ' - ' + client_phone : ''}`;

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
          schedule_id: DIAGNOSTIC_SCHEDULE_ID,
          booking: {
            start: fmt(startDate),
            finish: fmt(finishDate),
            full_name: client_name,
            email: client_email,
            phone: client_phone || '',
            description: libelle,
            field_1: besoin || '',
          },
        }),
      }
    );

    if (!bookingRes.ok) {
      const errText = await bookingRes.text();
      console.error('Erreur booking SuperSaaS diagnostic:', errText);
      return json({ error: 'SLOT_UNAVAILABLE' }, 409);
    }

    let bookingId: string | null = null;
    try {
      const bookingData = await bookingRes.json();
      bookingId = String(bookingData.id || bookingData.booking_id || '');
    } catch {
      const loc = bookingRes.headers.get('Location');
      if (loc) {
        const match = loc.match(/(\d+)\.json/);
        if (match) bookingId = match[1];
      }
    }

    // ---- Créer la room Daily si visio ----
    let roomUrl: string | null = null;
    if (mode === 'visio') {
      try {
        const nbf = Math.floor((startDate.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000);
        const exp = Math.floor((startDate.getTime() + (DIAGNOSTIC_DURATION_MIN + MARGIN_AFTER_MIN) * 60 * 1000) / 1000);
        const roomName = `idala-diag-${Date.now().toString(36)}`;

        const roomRes = await fetch(`${DAILY_API_BASE}/rooms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'public',
            properties: {
              nbf, exp,
              enable_chat: true,
              enable_screenshare: true,
              max_participants: 2,
              eject_at_room_exp: true,
            },
          }),
        });

        if (roomRes.ok) {
          const room = await roomRes.json();
          roomUrl = room.url;
        }
      } catch (e) {
        console.error('Erreur room Daily diagnostic:', String(e));
      }
    }

    // ---- Emails ----
    try {
      const fmtDate = (locale: string) =>
        new Intl.DateTimeFormat(locale, {
          timeZone: 'Europe/Paris',
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }).format(startDate);

      const fmtTime = (locale: string) =>
        new Intl.DateTimeFormat(locale, {
          timeZone: 'Europe/Paris',
          hour: '2-digit', minute: '2-digit',
        }).format(startDate);

      const wrap = (title: string, bodyHtml: string) => `
      <div style="margin:0;padding:0;background:#F0EAFA;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:2px;color:#3e295d;">The Idala Family</span>
          </div>
          <div style="background:#ffffff;border:1px solid #E4D8F5;border-radius:14px;padding:36px 32px;">
            <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;color:#3e295d;margin:0 0 20px;text-align:center;">${title}</h1>
            ${bodyHtml}
          </div>
          <div style="text-align:center;margin:28px 0 12px;">
            <img src="${LOGO_URL}" alt="The Idala Family" width="130" style="width:130px;height:auto;display:inline-block;" />
          </div>
          <p style="text-align:center;font-size:12px;color:#9B6EBF;margin-top:8px;font-style:italic;">Mens sana in corpore sano</p>
        </div>
      </div>`;

      const row = (label: string, value: string) => `
        <tr>
          <td style="padding:8px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:#281745;text-align:right;font-weight:500;">${value}</td>
        </tr>`;

      const modeFr = mode === 'visio' ? 'Visioconférence' : 'Appel WhatsApp';
      const modeEn = mode === 'visio' ? 'Video call' : 'WhatsApp call';

      // ---- Mail client ----
      const clientRecap = clientLang === 'en' ? `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Date', fmtDate('en-GB'))}
          ${row('Time', fmtTime('en-GB'))}
          ${row('Duration', '20 minutes')}
          ${row('Format', modeEn)}
        </table>` : `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Durée', '20 minutes')}
          ${row('Format', modeFr)}
        </table>`;


      const SITE_URL_DIAG = 'https://theidalafamily.com';
      const DIAG_DURATION_MIN = 20; // duree du diagnostic, adapte si differente
      const brandedRoomUrl = roomUrl
        ? `${SITE_URL_DIAG}/#/diagnostic-seance?room=${encodeURIComponent(roomUrl)}` +
          `&start=${encodeURIComponent(scheduledAtUTC)}` +
          `&min=${DIAG_DURATION_MIN}`
        : null;
        
      const accessBlock = mode === 'visio' && roomUrl
        ? (clientLang === 'en'
            ? `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;">Join your session here:<br/><a href="${brandedRoomUrl}" style="color:#9B6EBF;">${brandedRoomUrl}</a></p>`
            : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;">Rejoignez votre échange ici :<br/><a href="${brandedRoomUrl}" style="color:#9B6EBF;">${brandedRoomUrl}</a></p>`)
        : (clientLang === 'en'
            ? `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;">Diane will call you on WhatsApp at the scheduled time.</p>`
            : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;">Diane vous appellera sur WhatsApp à l'heure convenue.</p>`);

      const clientBody = clientLang === 'en' ? `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Hello ${client_name},<br/>your personalized consultation is confirmed.
        </p>
        ${clientRecap}
        ${accessBlock}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          For any question, email us at <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>` : `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Bonjour ${client_name},<br/>votre diagnostic personnalisé est confirmé.
        </p>
        ${clientRecap}
        ${accessBlock}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          Pour toute question, écrivez-nous à <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Idala Family <contact@theidalafamily.com>',
          to: client_email,
          subject: clientLang === 'en'
            ? 'Your consultation is confirmed : The Idala Family'
            : 'Votre diagnostic est confirmé : The Idala Family',
          html: wrap(
            clientLang === 'en' ? 'Consultation confirmed' : 'Diagnostic confirmé',
            clientBody
          ),
        }),
      });

      // ---- Mail Idala ----
      const idalaRecap = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Client', client_name)}
          ${row('Email', client_email)}
          ${client_phone ? row('Téléphone', client_phone) : ''}
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Format', modeFr)}
          ${roomUrl ? row('Lien visio', roomUrl) : ''}
        </table>
        ${besoin ? `
        <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;margin:16px 0 6px;">Besoin exprimé</p>
        <p style="font-size:14px;color:#281745;line-height:1.7;margin:0;background:#F0EAFA;padding:14px 16px;border-radius:8px;">${besoin}</p>` : ''}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Idala Family <contact@theidalafamily.com>',
          to: 'contact@theidalafamily.com',
          subject: `Nouveau diagnostic : ${client_name}`,
          html: wrap('Nouveau diagnostic réservé', `
            <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
              Un diagnostic personnalisé vient d'être réservé.
            </p>
            ${idalaRecap}`),
        }),
      });

    } catch (mailErr) {
      console.error('Erreur envoi emails diagnostic:', String(mailErr));
    }

    return json({
      success: true,
      booking_id: bookingId,
      room_url: roomUrl,
    }, 200);

  } catch (err) {
    return json({ error: 'SERVER_ERROR', details: String(err) }, 500);
  }
});

// Convertit une heure locale de Paris ("2026-07-16T19:30") en instant UTC ISO.
// Calcule le décalage réel de Paris pour la date (été +02:00, hiver +01:00).
function parisToUTC(local: string): string {
  const clean = local.replace(' ', 'T').slice(0, 16);
  const guess = new Date(clean + ':00Z');
  const parisShown = new Date(guess.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const utcShown = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = parisShown.getTime() - utcShown.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
