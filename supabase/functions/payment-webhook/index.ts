import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_PAYMENT_WEBHOOK_SECRET = Deno.env.get('STRIPE_PAYMENT_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;

const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';
const OPEN_BEFORE_MIN = 15;
const MARGIN_AFTER_MIN = 60;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Signature manquante', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, STRIPE_PAYMENT_WEBHOOK_SECRET, undefined, cryptoProvider
    );
  } catch (err) {
    return new Response(`Signature invalide: ${String(err)}`, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const m = pi.metadata ?? {};

    if (m.platform !== 'idala') return ok();

    // Anti-doublon
    const { data: existingResa } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_payment_intent_id', pi.id)
      .maybeSingle();
    if (existingResa) return ok();

    const durationMin = parseInt(m.duree_seance || '60', 10) || 60;
    const maxParticipants = parseInt(m.max_participants || '1', 10) || 1;
    const modeSeance = m.mode_seance || 'visio';

    // Session existante (groupe) ou nouvelle
    let sessionId: string;
    let sessionScheduledAt: string = m.scheduled_at;
    let sessionRoomName: string | null = null;

    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id, booked_count, max_participants, status, scheduled_at, daily_room_name')
      .eq('praticien_id', m.praticien_id)
      .eq('pratique_id', m.pratique_id)
      .eq('scheduled_at', m.scheduled_at)
      .maybeSingle();

    if (existingSession) {
      if (existingSession.status === 'full' ||
          existingSession.booked_count >= existingSession.max_participants) {
        console.error('Session pleine pour PI', pi.id);
        return ok();
      }
      sessionId = existingSession.id;
      sessionScheduledAt = existingSession.scheduled_at;
      sessionRoomName = existingSession.daily_room_name;
    } else {
      const { data: newSession, error: sErr } = await supabase
        .from('sessions')
        .insert({
          praticien_id: m.praticien_id,
          pratique_id: m.pratique_id,
          scheduled_at: m.scheduled_at,
          duration_minutes: durationMin,
          max_participants: maxParticipants,
          mode_seance: modeSeance,
          status: 'open',
        })
        .select('id, scheduled_at')
        .single();

      if (sErr || !newSession) {
        console.error('Erreur création session:', sErr?.message);
        return ok();
      }

      sessionId = newSession.id;
      sessionScheduledAt = newSession.scheduled_at;
    }

    // Créer la réservation
    const priceCents = parseInt(m.price_cents || '0', 10);
    const feeCents = parseInt(m.fee_cents || '0', 10);

    const { error: rErr } = await supabase
      .from('reservations')
      .insert({
        session_id: sessionId,
        client_email: m.client_email,
        client_name: m.client_name,
        praticien_id: m.praticien_id,
        pratique_id: m.pratique_id,
        status: 'confirmed',
        lang: m.lang || 'fr',
        price_cents: priceCents,
        commission_cents: feeCents,
        currency: 'eur',
        stripe_payment_intent_id: pi.id,
        stripe_charge_id: typeof pi.latest_charge === 'string' ? pi.latest_charge : null,
      });

    if (rErr) {
      console.error('Erreur création réservation:', rErr.message);
      return ok();
    }

    // ---- Charger le nom de la pratique (réutilisé pour SuperSaaS ET les mails) ----
    let pratiqueNom = 'Séance';
    {
      const { data: prqName } = await supabase
        .from('pratiques')
        .select('nom')
        .eq('id', m.pratique_id)
        .single();
      if (prqName?.nom) pratiqueNom = prqName.nom;
    }

    // ---- Créer la réservation dans SuperSaaS (bloque le créneau) ----
    try {
      const { data: prat } = await supabase
        .from('praticiens')
        .select('supersaas_schedule_id')
        .eq('id', m.praticien_id)
        .single();

      if (prat?.supersaas_schedule_id) {
        const scheduleId = prat.supersaas_schedule_id;

        // Calcul du finish (start + durée)
        const startDate = new Date(m.scheduled_at);
        const finishDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

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

        const libelle = `${pratiqueNom} ${modeSeance} - ${m.client_name}`;

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
                start: fmt(startDate),
                finish: fmt(finishDate),
                full_name: m.client_name,
                email: m.client_email,
                description: libelle,
              },
            }),
          }
        );

        if (bookingRes.ok) {
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

          if (bookingId) {
            await supabase
              .from('sessions')
              .update({ supersaas_booking_id: bookingId })
              .eq('id', sessionId);
          }
        } else {
          console.error('Erreur création booking SuperSaaS:', await bookingRes.text());
        }
      }
    } catch (e) {
      console.error('Exception booking SuperSaaS:', String(e));
    }

    // Incrémenter le compteur (update direct)
    const newCount = (existingSession?.booked_count ?? 0) + 1;
    await supabase
      .from('sessions')
      .update({
        booked_count: newCount,
        status: newCount >= maxParticipants ? 'full' : 'open',
      })
      .eq('id', sessionId);

    // Créer la room Daily.co DIRECTEMENT (si visio et pas déjà créée)
    if (modeSeance === 'visio' && !sessionRoomName) {
      try {
        const scheduledAt = new Date(sessionScheduledAt);
        const nbf = Math.floor((scheduledAt.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000);
        const exp = Math.floor((scheduledAt.getTime() + (durationMin + MARGIN_AFTER_MIN) * 60 * 1000) / 1000);
        const roomCapacity = maxParticipants + 1;
        const roomName = `idala-${sessionId.slice(0, 8)}-${Date.now().toString(36)}`;

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
          await supabase
            .from('sessions')
            .update({
              daily_room_name: room.name,
              daily_room_url: room.url,
              daily_room_expires_at: new Date(exp * 1000).toISOString(),
            })
            .eq('id', sessionId);
        } else {
          console.error('Erreur création room Daily:', await roomRes.text());
        }
      } catch (e) {
        console.error('Exception room Daily:', String(e));
      }
    }

    // ============================================================
    //  EMAILS DE CONFIRMATION (client + praticien)
    // ============================================================
    try {
      const { data: praticienData } = await supabase
        .from('praticiens')
        .select('prenom, nom, email, langues')
        .eq('id', m.praticien_id)
        .single();

      const startDate = new Date(m.scheduled_at);

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

      const modeMap: Record<string, { fr: string; en: string }> = {
        visio:    { fr: 'En visioconférence', en: 'Online (video)' },
        domicile: { fr: 'À domicile',          en: 'At home' },
        cabinet:  { fr: 'En cabinet',          en: 'At the practice' },
      };
      const modeFr = modeMap[modeSeance]?.fr || modeSeance;
      const modeEn = modeMap[modeSeance]?.en || modeSeance;

      const clientLang = (m.lang === 'en') ? 'en' : 'fr';

      const praticienLangues = (praticienData?.langues || '').toLowerCase();
      const praticienLang =
        (praticienLangues.includes('franç') || praticienLangues.includes('french') || praticienLangues === '')
          ? 'fr' : 'en';

      const prixEuros = m.price_cents ? (parseInt(m.price_cents, 10) / 100) : null;

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
            <img src="https://qpdevexolzjqeyjjehjf.supabase.co/storage/v1/object/public/assets/newlogo.png" alt="The Idala Family" width="130" style="width:130px;height:auto;display:inline-block;" />
          </div>
          <p style="text-align:center;font-size:12px;color:#9B6EBF;margin-top:8px;font-style:italic;">Mens sana in corpore sano</p>
        </div>
      </div>`;

      const row = (label: string, value: string) => `
        <tr>
          <td style="padding:8px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:#281745;text-align:right;font-weight:500;">${value}</td>
        </tr>`;

      // MAIL CLIENT
      const clientRecapFr = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Séance', pratiqueNom)}
          ${row('Praticien', `${praticienData?.prenom || ''} ${(praticienData?.nom || '').charAt(0)}.`)}
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Format', modeFr)}
          ${prixEuros ? row('Montant', `${prixEuros} €`) : ''}
        </table>`;

      const clientRecapEn = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Session', pratiqueNom)}
          ${row('Practitioner', `${praticienData?.prenom || ''} ${(praticienData?.nom || '').charAt(0)}.`)}
          ${row('Date', fmtDate('en-GB'))}
          ${row('Time', fmtTime('en-GB'))}
          ${row('Format', modeEn)}
          ${prixEuros ? row('Amount', `${prixEuros} €`) : ''}
        </table>`;

      const clientBodyFr = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Bonjour ${m.client_name},<br/>votre séance est confirmée.
        </p>
        ${clientRecapFr}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          ${modeSeance === 'visio'
            ? 'Le lien de connexion à votre séance vous sera envoyé peu avant le rendez-vous.'
            : 'Vous recevrez un rappel avant votre rendez-vous.'}
        </p>
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:16px 0 0;">
          Pour toute question, écrivez-nous à <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>`;

      const clientBodyEn = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Hello ${m.client_name},<br/>your session is confirmed.
        </p>
        ${clientRecapEn}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          ${modeSeance === 'visio'
            ? 'The link to join your session will be sent to you shortly before the appointment.'
            : 'You will receive a reminder before your appointment.'}
        </p>
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:16px 0 0;">
          For any question, email us at <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>`;

      const clientSubject = clientLang === 'en'
        ? 'Your session is confirmed : The Idala Family'
        : 'Votre séance est confirmée : The Idala Family';

      const clientHtml = clientLang === 'en'
        ? wrap('Booking confirmed', clientBodyEn)
        : wrap('Réservation confirmée', clientBodyFr);

      // MAIL PRATICIEN
      const pratRecapFr = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Séance', pratiqueNom)}
          ${row('Client', m.client_name)}
          ${row('Email', m.client_email)}
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Format', modeFr)}
        </table>`;

      const pratRecapEn = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Session', pratiqueNom)}
          ${row('Client', m.client_name)}
          ${row('Email', m.client_email)}
          ${row('Date', fmtDate('en-GB'))}
          ${row('Time', fmtTime('en-GB'))}
          ${row('Format', modeEn)}
        </table>`;

      const pratBodyFr = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Bonjour ${praticienData?.prenom || ''},<br/>vous avez une nouvelle réservation.
        </p>
        ${pratRecapFr}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          ${modeSeance === 'visio'
            ? 'Le lien de la visioconférence vous sera transmis avant la séance.'
            : 'Pensez à préparer votre séance.'}
        </p>`;

      const pratBodyEn = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Hello ${praticienData?.prenom || ''},<br/>you have a new booking.
        </p>
        ${pratRecapEn}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">
          ${modeSeance === 'visio'
            ? 'The video link will be sent to you before the session.'
            : 'Remember to prepare for your session.'}
        </p>`;

      const pratSubject = praticienLang === 'en'
        ? 'New booking : The Idala Family'
        : 'Nouvelle réservation : The Idala Family';

      const pratHtml = praticienLang === 'en'
        ? wrap('New booking', pratBodyEn)
        : wrap('Nouvelle réservation', pratBodyFr);

      // ============ MAIL IDALA (récap interne avec commission) ============
      const feeCentsMail = m.fee_cents ? parseInt(m.fee_cents, 10) : 0;
      const commissionEuros = feeCentsMail ? (feeCentsMail / 100) : 0;
      const partPraticienEuros = (prixEuros !== null) ? (prixEuros - commissionEuros) : null;

      const idalaRecap = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Séance', pratiqueNom)}
          ${row('Praticien', `${praticienData?.prenom || ''} ${praticienData?.nom || ''}`)}
          ${row('Client', m.client_name)}
          ${row('Email client', m.client_email)}
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Format', modeFr)}
          ${prixEuros !== null ? row('Montant payé', `${prixEuros} €`) : ''}
          ${row('Commission Idala', `${commissionEuros} €`)}
          ${partPraticienEuros !== null ? row('Part praticien', `${partPraticienEuros} €`) : ''}
        </table>`;

      const idalaBody = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Une nouvelle réservation a été effectuée sur la plateforme.
        </p>
        ${idalaRecap}`;

      const idalaHtml = wrap('Nouvelle réservation', idalaBody);
      const idalaSubject = `Nouvelle réservation : ${pratiqueNom} avec ${praticienData?.prenom || ''} ${praticienData?.nom || ''}`;

      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

      // Mail client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Idala Family <contact@theidalafamily.com>',
          to: m.client_email,
          subject: clientSubject,
          html: clientHtml,
        }),
      });

      // Mail Idala (récap interne)
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Idala Family <contact@theidalafamily.com>',
          to: 'contact@theidalafamily.com',
          subject: idalaSubject,
          html: idalaHtml,
        }),
      });

      // Mail praticien (si on a son email)
      if (praticienData?.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'The Idala Family <contact@theidalafamily.com>',
            to: praticienData.email,
            subject: pratSubject,
            html: pratHtml,
          }),
        });
      }

    } catch (mailErr) {
      console.error('Erreur envoi emails de confirmation:', String(mailErr));
    }

  }

  return ok();
});

function ok() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}