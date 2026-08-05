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

// Traduction convention modes.jsx (visio / home / in-person) vers la convention
// stockée dans la table sessions (visio / domicile / cabinet).
const MODE_TO_SESSION: Record<string, string> = {
  visio: 'visio',
  home: 'domicile',
  'in-person': 'cabinet',
};

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

    // mode_seance en convention modes.jsx (visio / home / in-person).
    // Défaut prudent : 'in-person' (jamais 'visio' par défaut, pour ne pas créer
    // de room Daily inutile si une métadonnée était absente).
    const modeSeance = m.mode_seance || 'in-person';
    // Valeur traduite pour la table sessions (visio / domicile / cabinet).
    const modeSession = MODE_TO_SESSION[modeSeance] || modeSeance;

    // Session existante (groupe) ou nouvelle.
    // On matche aussi sur le mode traduit : deux modes différents au même créneau
    // ne doivent pas être fusionnés dans la même session.
    let sessionId: string;
    let sessionScheduledAt: string = m.scheduled_at;
    let sessionRoomName: string | null = null;
    let praticienJoinSecret: string | null = null;

    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id, booked_count, max_participants, status, scheduled_at, daily_room_name, praticien_join_secret')
      .eq('praticien_id', m.praticien_id)
      .eq('pratique_id', m.pratique_id)
      .eq('scheduled_at', m.scheduled_at)
      .eq('mode_seance', modeSession)
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
      praticienJoinSecret = existingSession.praticien_join_secret;
    } else {
      const { data: newSession, error: sErr } = await supabase
        .from('sessions')
        .insert({
          praticien_id: m.praticien_id,
          pratique_id: m.pratique_id,
          scheduled_at: m.scheduled_at,
          duration_minutes: durationMin,
          max_participants: maxParticipants,
          mode_seance: modeSession,
          status: 'open',
        })
        .select('id, scheduled_at, praticien_join_secret')
        .single();

      if (sErr || !newSession) {
        console.error('Erreur création session:', sErr?.message);
        return ok();
      }

      sessionId = newSession.id;
      sessionScheduledAt = newSession.scheduled_at;
      praticienJoinSecret = newSession.praticien_join_secret;
    }

    // Créer la réservation
    const priceCents = parseInt(m.price_cents || '0', 10);
    const feeCents = parseInt(m.fee_cents || '0', 10);

    const { data: newResa, error: rErr } = await supabase
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
        client_adresse:     m.client_adresse     || null,
        client_code_postal: m.client_code_postal || null,
        client_ville:       m.client_ville       || null,
        client_digicode:    m.client_digicode    || null,
        client_interphone:  m.client_interphone  || null,
        client_etage:       m.client_etage        || null,
        client_complement:  m.client_complement  || null,
      })
      .select('id, cancel_token')
      .single();

    if (rErr) {
      console.error('Erreur création réservation:', rErr.message);
      return ok();
    }

    const cancelToken = newResa?.cancel_token ?? null;
    const reservationId = newResa?.id ?? null;

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

        const libelle = `${pratiqueNom} ${modeSession} - ${m.client_name}`;

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

    // Créer la room Daily.co DIRECTEMENT (si visio et pas déjà créée).
    // home / in-person = pas de room : séance en présentiel.
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
              enable_prejoin_ui: false,
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
    //  FRAIS STRIPE RÉELS (pour le récap Idala)
    // ============================================================
    let stripeFeeCents = 0;
    try {
      const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : null;
      if (chargeId) {
        // Récupérer le stripe_account_id du praticien (direct charge = compte connecté)
        const { data: stripeAcc } = await supabase
          .from('stripe_accounts')
          .select('stripe_account_id')
          .eq('praticien_id', m.praticien_id)
          .single();

        if (stripeAcc?.stripe_account_id) {
          const charge = await stripe.charges.retrieve(
            chargeId,
            { expand: ['balance_transaction'] },
            { stripeAccount: stripeAcc.stripe_account_id }
          );
          const bt = charge.balance_transaction;
          if (bt && typeof bt !== 'string') {
            // Sur un direct charge, bt.fee = frais Stripe réels + application fee (commission Idala).
            // On soustrait l'application fee pour isoler les VRAIS frais de traitement Stripe.
            const applicationFeeCents = parseInt(m.fee_cents || '0', 10);
            stripeFeeCents = Math.max(0, (bt.fee ?? 0) - applicationFeeCents);
          }
        }
      }
    } catch (e) {
      console.error('Erreur récupération frais Stripe:', String(e));
      // On continue sans planter : le mail affichera les frais comme indisponibles
    }

    // ============================================================
    //  EMAILS DE CONFIRMATION (client + praticien)
    // ============================================================
    try {
      const { data: praticienData } = await supabase
        .from('praticiens')
        .select('prenom, nom, email, langues, cabinet_adresse, cabinet_code_postal, cabinet_ville, cabinet_digicode, cabinet_interphone, cabinet_etage, cabinet_complement')        
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

      // Clé en convention sessions (visio / domicile / cabinet), on consulte avec modeSession.
      const modeMap: Record<string, { fr: string; en: string }> = {
        visio:    { fr: 'En visioconférence', en: 'Online (video)' },
        domicile: { fr: 'À domicile',          en: 'At home' },
        cabinet:  { fr: 'En cabinet',          en: 'At the practice' },
      };
      const modeFr = modeMap[modeSession]?.fr || modeSession;
      const modeEn = modeMap[modeSession]?.en || modeSession;

      const clientLang = (m.lang === 'en') ? 'en' : 'fr';

      const SITE_URL = 'https://theidalafamily.com';
      const modifyUrl = `${SITE_URL}/#/modifier/${cancelToken}`;
      const cancelUrl = `${SITE_URL}/#/annulation/${cancelToken}`;

      // Liens vers la page /seance, qui génère le token Daily à la volée.
      // Côté client via ?r=reservation_id, côté praticien via ?p=praticien_join_secret.
      // La room n'ouvre que 15 min avant : cliquer plus tôt renvoie un message d'attente.
      const clientSeanceUrl = `${SITE_URL}/#/seance/${sessionId}?r=${reservationId}`;
      const praticienSeanceUrl = praticienJoinSecret
        ? `${SITE_URL}/#/seance/${sessionId}?p=${praticienJoinSecret}`
        : null;

      const joinButton = (href: string, label: string, note: string) => `
        <div style="text-align:center;margin:8px 0 4px;">
          <a href="${href}" style="display:inline-block;padding:13px 30px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">${label}</a>
        </div>
        <p style="font-size:12px;color:#9B6EBF;line-height:1.6;margin:12px 0 0;text-align:center;">${note}</p>`;

      const clientActionsFr = cancelToken ? `
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E4D8F5;">
          <p style="font-size:12px;color:#9B6EBF;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;text-align:center;">Besoin de changer ?</p>
          <p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;text-align:center;">
            Vous pouvez modifier ou annuler votre rendez-vous jusqu'à 24h avant la séance.
          </p>
          <div style="text-align:center;">
            <a href="${modifyUrl}" style="display:inline-block;margin:0 6px 8px;padding:11px 22px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Modifier</a>
            <a href="${cancelUrl}" style="display:inline-block;margin:0 6px 8px;padding:11px 22px;background:transparent;color:#9B6EBF;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid #C9A8E0;border-radius:8px;">Annuler</a>
          </div>
        </div>` : '';

      const clientActionsEn = cancelToken ? `
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E4D8F5;">
          <p style="font-size:12px;color:#9B6EBF;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;text-align:center;">Need to change ?</p>
          <p style="font-size:13px;color:#413459;line-height:1.7;margin:0 0 16px;text-align:center;">
            You can reschedule or cancel your appointment up to 24h before the session.
          </p>
          <div style="text-align:center;">
            <a href="${modifyUrl}" style="display:inline-block;margin:0 6px 8px;padding:11px 22px;background:#9B6EBF;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:8px;">Reschedule</a>
            <a href="${cancelUrl}" style="display:inline-block;margin:0 6px 8px;padding:11px 22px;background:transparent;color:#9B6EBF;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid #C9A8E0;border-radius:8px;">Cancel</a>
          </div>
        </div>` : '';

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

        // Objets adresse : cabinet du praticien, domicile du client
      const praticienCabinet = {
        adresse: praticienData?.cabinet_adresse || '', code_postal: praticienData?.cabinet_code_postal || '',
        ville: praticienData?.cabinet_ville || '', digicode: praticienData?.cabinet_digicode || '',
        interphone: praticienData?.cabinet_interphone || '', etage: praticienData?.cabinet_etage || '',
        complement: praticienData?.cabinet_complement || '',
      };
      const clientAddress = {
        adresse: m.client_adresse || '', code_postal: m.client_code_postal || '',
        ville: m.client_ville || '', digicode: m.client_digicode || '',
        interphone: m.client_interphone || '', etage: m.client_etage || '',
        complement: m.client_complement || '',
      };

      const addrBlock = (title: string, a: any, l: 'fr' | 'en') => {
        if (!a.adresse) return '';
        const L = l === 'en'
          ? { digicode: 'Door code', interphone: 'Intercom', etage: 'Floor' }
          : { digicode: 'Digicode', interphone: 'Interphone', etage: 'Étage' };
        const lines = [
          a.adresse,
          [a.code_postal, a.ville].filter(Boolean).join(' '),
          a.digicode ? `${L.digicode} : ${a.digicode}` : '',
          a.interphone ? `${L.interphone} : ${a.interphone}` : '',
          a.etage ? `${L.etage} : ${a.etage}` : '',
          a.complement,
        ].filter(Boolean);
        return `
          <div style="margin:8px 0 24px;padding:18px 20px;background:#F7F2FE;border:1px solid #E4D8F5;border-radius:12px;">
            <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9B6EBF;margin:0 0 10px;">${title}</p>
            <p style="font-size:14px;color:#281745;line-height:1.7;margin:0;">${lines.join('<br/>')}</p>
          </div>`;
      };

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
        ${modeSession === 'cabinet' ? addrBlock('Adresse du cabinet', praticienCabinet, 'fr') : ''}
        ${modeSeance === 'visio'
          ? joinButton(clientSeanceUrl, 'Rejoindre ma séance', "La salle s'ouvre 15 minutes avant le début de la séance.")
          : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">Vous recevrez un rappel avant votre rendez-vous.</p>`}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:16px 0 0;">
          Pour toute question, écrivez-nous à <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>
        ${clientActionsFr}`;

      const clientBodyEn = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Hello ${m.client_name},<br/>your session is confirmed.
        </p>
        ${clientRecapEn}
        ${modeSession === 'cabinet' ? addrBlock('Practice address', praticienCabinet, 'en') : ''}
        ${modeSeance === 'visio'
          ? joinButton(clientSeanceUrl, 'Join my session', 'The room opens 15 minutes before the session starts.')
          : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">You will receive a reminder before your appointment.</p>`}
        <p style="font-size:13px;color:#413459;line-height:1.7;margin:16px 0 0;">
          For any question, email us at <a href="mailto:contact@theidalafamily.com" style="color:#9B6EBF;">contact@theidalafamily.com</a>.
        </p>
        ${clientActionsEn}`;

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
        ${modeSession === 'domicile' ? addrBlock('Adresse du client', clientAddress, 'fr') : ''}
        ${modeSeance === 'visio' && praticienSeanceUrl
          ? joinButton(praticienSeanceUrl, 'Rejoindre ma séance', "La salle s'ouvre 15 minutes avant le début de la séance.")
          : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">${modeSeance === 'visio' ? 'Le lien de la visioconférence vous sera transmis avant la séance.' : 'Pensez à préparer votre séance.'}</p>`}`;

      const pratBodyEn = `
        <p style="font-size:15px;color:#413459;line-height:1.7;margin:0 0 8px;text-align:center;">
          Hello ${praticienData?.prenom || ''},<br/>you have a new booking.
        </p>
        ${pratRecapEn}
        ${modeSession === 'domicile' ? addrBlock('Client address', clientAddress, 'en') : ''}
        ${modeSeance === 'visio' && praticienSeanceUrl
          ? joinButton(praticienSeanceUrl, 'Join my session', 'The room opens 15 minutes before the session starts.')
          : `<p style="font-size:13px;color:#413459;line-height:1.7;margin:0;">${modeSeance === 'visio' ? 'The video link will be sent to you before the session.' : 'Remember to prepare for your session.'}</p>`}`;

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

      const stripeFeeEuros = stripeFeeCents / 100;
      const commissionNetteEuros = commissionEuros - stripeFeeEuros;

      const fmtEur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

      const idalaRecap = `
        <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">
          ${row('Séance', pratiqueNom)}
          ${row('Praticien', `${praticienData?.prenom || ''} ${praticienData?.nom || ''}`)}
          ${row('Client', m.client_name)}
          ${row('Email client', m.client_email)}
          ${row('Date', fmtDate('fr-FR'))}
          ${row('Heure', fmtTime('fr-FR'))}
          ${row('Format', modeFr)}
          ${prixEuros !== null ? row('Montant payé', fmtEur(prixEuros)) : ''}
          ${partPraticienEuros !== null ? row('Part praticien (85%)', fmtEur(partPraticienEuros)) : ''}
          ${row('Commission Idala (15%)', fmtEur(commissionEuros))}
          ${stripeFeeCents > 0 ? row('Frais Stripe (à charge Idala)', `- ${fmtEur(stripeFeeEuros)}`) : ''}
          ${stripeFeeCents > 0 ? row('Commission Idala nette', fmtEur(commissionNetteEuros)) : ''}
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