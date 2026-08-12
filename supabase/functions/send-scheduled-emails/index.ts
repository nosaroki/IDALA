import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://theidalafamily.com';
const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJv_IrXJ1l5kcRnSeh0213jaw';
const FROM_EMAIL = 'Idala <contact@theidalafamily.com>';

const FONT_IMPORT = `<style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap');</style>`;
const BODY_FONT = "'Jost', 'Helvetica Neue', Arial, sans-serif";
const TITLE_FONT = "'Cormorant Garamond', Georgia, serif";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Variante de rappel : 'veille' (J-1) ou 'proche' (1 a 2h avant).
type ReminderVariant = 'veille' | 'proche';

// ---------- Helpers ----------

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed for ${to}: ${err}`);
  }
  return res.json();
}

function formatDateFR(iso: string) {
  const formatted = new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });
  return `${formatted} (heure de Paris, France)`;
}

function formatDateEN(iso: string) {
  const formatted = new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });
  return `${formatted} (Paris time, France)`;
}

function firstName(fullName: string | null): string {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

// Sujets selon la variante.
function clientReminderSubject(variant: ReminderVariant, lang: 'fr' | 'en') {
  if (variant === 'proche') {
    return lang === 'en' ? 'Reminder: your session is coming up' : 'Rappel : votre séance approche';
  }
  return lang === 'en' ? 'Reminder: your session tomorrow' : 'Rappel : votre séance demain';
}

// ---------- Email templates ----------

function reminderClientHTML(p: {
  clientPrenom: string;
  praticienPrenom: string;
  praticienNom: string;
  sessionType: string;
  duration: number;
  dateStr: string;
  visioUrl: string;
  lang: 'fr' | 'en';
  isVisio: boolean;
  variant: ReminderVariant;
}) {
  if (p.lang === 'en') {
    const heading = p.variant === 'proche'
      ? 'Reminder: your session is coming up'
      : 'Reminder: your session tomorrow';
    const intro = p.variant === 'proche'
      ? `Your session with <strong>${p.praticienPrenom} ${p.praticienNom}</strong> is coming up.`
      : `A friendly reminder about your upcoming session with <strong>${p.praticienPrenom} ${p.praticienNom}</strong>.`;
    return `
      ${FONT_IMPORT}
      <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
        <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">${heading}</h2>
        <p>Hi ${p.clientPrenom},</p>
        <p>${intro}</p>
        <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
          <p style="margin: 0 0 8px;">${p.dateStr}</p>
          <p style="margin: 0;">Duration: ${p.duration} minutes</p>
        </div>
        ${p.isVisio ? `<p>The video room opens 15 minutes before the session starts.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Join the session</a>
        </p>` : ''}
        <p style="color: #888; font-size: 13px;">See you soon,<br>The Idala team</p>
      </div>
    `;
  }
  const heading = p.variant === 'proche'
    ? 'Rappel : votre séance approche'
    : 'Rappel : votre séance demain';
  const intro = p.variant === 'proche'
    ? `Votre séance avec <strong>${p.praticienPrenom} ${p.praticienNom}</strong> approche.`
    : `Petit rappel de votre séance à venir avec <strong>${p.praticienPrenom} ${p.praticienNom}</strong>.`;
  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">${heading}</h2>
      <p>Bonjour ${p.clientPrenom},</p>
      <p>${intro}</p>
      <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
        <p style="margin: 0 0 8px;">${p.dateStr}</p>
        <p style="margin: 0;">Durée : ${p.duration} minutes</p>
      </div>
      ${p.isVisio ? `<p>La salle de visio s'ouvre 15 minutes avant le début de la séance.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Rejoindre la séance</a>
      </p>` : ''}
      <p style="color: #888; font-size: 13px;">À très vite,<br>L'équipe Idala</p>
    </div>
  `;
}

function reminderPraticienHTML(p: {
  praticienPrenom: string;
  clientsInfo: string;
  sessionType: string;
  duration: number;
  dateStr: string;
  visioUrl: string;
  clientNotes: string[];
  isVisio: boolean;
  variant: ReminderVariant;
}) {
  const notesBlock = p.clientNotes.length > 0
    ? `
      <div style="background: #fdf9f2; border-left: 3px solid #c9a961; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #888;">Notes des clients</p>
        ${p.clientNotes.map(n => `<p style="margin: 0 0 8px; font-style: italic;">${n}</p>`).join('')}
      </div>
    `
    : '';

  const heading = p.variant === 'proche'
    ? 'Rappel : séance imminente'
    : 'Rappel : séance demain';
  const intro = p.variant === 'proche'
    ? `Votre séance avec <strong>${p.clientsInfo}</strong> approche.`
    : `Rappel de votre séance à venir : <strong>${p.clientsInfo}</strong>.`;

  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">${heading}</h2>
      <p>Bonjour ${p.praticienPrenom},</p>
      <p>${intro}</p>
      <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
        <p style="margin: 0 0 8px;">${p.dateStr}</p>
        <p style="margin: 0;">Durée : ${p.duration} minutes</p>
      </div>
      ${notesBlock}
      ${p.isVisio ? `<p>La salle de visio s'ouvre 15 minutes avant le début de la séance.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à la séance</a>
      </p>` : ''}
      <p style="color: #888; font-size: 13px;">Belle séance,<br>L'équipe Idala</p>
    </div>
  `;
}

function followupClientHTML(p: {
  clientPrenom: string;
  praticienPrenom: string;
  sessionType: string;
  lang: 'fr' | 'en';
}) {
  if (p.lang === 'en') {
    return `
      ${FONT_IMPORT}
      <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
        <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">A little word after your session</h2>
        <p>Hello ${p.clientPrenom},</p>
        <p>I hope your session with ${p.praticienPrenom} went well.</p>
        <p>Feel free to leave us a Google review, it would help a great deal in making Idala known.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${GOOGLE_REVIEW_URL}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a review</a>
        </p>
        <p style="margin-top: 32px;">With love and kindness,<br>Idala</p>
      </div>
    `;
  }
  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">Un petit mot après votre séance</h2>
      <p>Bonjour ${p.clientPrenom},</p>
      <p>J'espère que votre séance avec ${p.praticienPrenom} s'est bien passée.</p>
      <p>N'hésitez pas à nous laisser un avis Google, cela aiderait grandement à faire connaître Idala.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${GOOGLE_REVIEW_URL}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Laisser un avis</a>
      </p>
      <p style="margin-top: 32px;">Avec amour et bienveillance,<br>Idala</p>
    </div>
  `;
}

// ---------- Passe de rappel (factorisée pour veille ET proche) ----------

async function runReminderPass(opts: {
  windowStartMs: number;
  windowEndMs: number;
  variant: ReminderVariant;
  clientFlagCol: string;   // colonne temoin cote reservation
  sessionFlagCol: string;  // colonne temoin cote session
  results: { client_reminders_sent: number; praticien_reminders_sent: number; errors: string[] };
}) {
  const { windowStartMs, windowEndMs, variant, clientFlagCol, sessionFlagCol, results } = opts;

  const { data: upcomingRes, error: errUp } = await supabase
    .from('reservations')
    .select(`
      id, client_email, client_name, lang, notes_client, status,
      ${clientFlagCol},
      session:session_id (
        id, scheduled_at, duration_minutes, mode_seance,
        praticien_join_secret, ${sessionFlagCol}
      ),
      praticien:praticien_id (prenom, nom, email),
      pratique:pratique_id (nom)
    `)
    .in('status', ['confirmed', 'paid'])
    .is(clientFlagCol, null)
    .not('session_id', 'is', null);

  if (errUp) throw new Error(`Fetch reservations (${variant}): ${errUp.message}`);

  const due = (upcomingRes ?? []).filter((r: any) => {
    if (!r.session?.scheduled_at) return false;
    const t = new Date(r.session.scheduled_at).getTime();
    return t >= windowStartMs && t < windowEndMs;
  });

  // Groupement par session pour le mail praticien (une fois par séance)
  const bySession = new Map<string, any[]>();
  for (const r of due) {
    const sid = r.session.id;
    if (!bySession.has(sid)) bySession.set(sid, []);
    bySession.get(sid)!.push(r);
  }

  // Envoi mail client (un par réservation)
  for (const r of due) {
    try {
      const lang = (r.lang as 'fr' | 'en') ?? 'fr';
      const clientVisioUrl = `${SITE_URL}/#/seance/${r.session.id}?r=${r.id}`;
      const dateStr = lang === 'en'
        ? formatDateEN(r.session.scheduled_at)
        : formatDateFR(r.session.scheduled_at);

      await sendEmail(
        r.client_email,
        clientReminderSubject(variant, lang),
        reminderClientHTML({
          clientPrenom: firstName(r.client_name),
          praticienPrenom: r.praticien.prenom,
          praticienNom: r.praticien.nom,
          sessionType: r.pratique.nom,
          duration: r.session.duration_minutes,
          dateStr,
          visioUrl: clientVisioUrl,
          lang,
          isVisio: r.session.mode_seance === 'visio',
          variant,
        })
      );

      await supabase
        .from('reservations')
        .update({ [clientFlagCol]: new Date().toISOString() })
        .eq('id', r.id);

      results.client_reminders_sent++;
    } catch (e) {
      results.errors.push(`Client reminder ${variant} ${r.id}: ${(e as Error).message}`);
    }
  }

  // Envoi mail praticien (un par séance, pas par réservation)
  for (const [sessionId, reservations] of bySession) {
    const first = reservations[0];
    if (first.session[sessionFlagCol]) continue; // déjà envoyé pour cette variante

    try {
      const clientsInfo = reservations.length === 1
        ? `séance avec ${first.client_name}`
        : `séance de groupe (${reservations.length} participants)`;

      const clientsList = reservations.length === 1
        ? first.client_name
        : reservations.map((r: any) => r.client_name).join(', ');

      const clientNotes = reservations
        .filter((r: any) => r.notes_client)
        .map((r: any) => reservations.length > 1
          ? `${r.client_name} : ${r.notes_client}`
          : r.notes_client);

      const visioUrl = `${SITE_URL}/#/seance/${sessionId}?p=${first.session.praticien_join_secret}`;
      const dateStr = formatDateFR(first.session.scheduled_at);

      await sendEmail(
        first.praticien.email,
        `Rappel : ${clientsInfo}`,
        reminderPraticienHTML({
          praticienPrenom: first.praticien.prenom,
          clientsInfo: clientsList,
          sessionType: first.pratique.nom,
          duration: first.session.duration_minutes,
          dateStr,
          visioUrl,
          clientNotes,
          isVisio: first.session.mode_seance === 'visio',
          variant,
        })
      );

      await supabase
        .from('sessions')
        .update({ [sessionFlagCol]: new Date().toISOString() })
        .eq('id', sessionId);

      results.praticien_reminders_sent++;
    } catch (e) {
      results.errors.push(`Praticien reminder ${variant} ${sessionId}: ${(e as Error).message}`);
    }
  }
}

// ---------- Main handler ----------

serve(async (req) => {
  const authHeader = req.headers.get('authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results = {
    client_reminders_sent: 0,
    praticien_reminders_sent: 0,
    followups_sent: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();

    // ===== PASSE 1 : Rappel de la veille (J-1), fenetre 24h a 25h =====
    await runReminderPass({
      windowStartMs: now.getTime() + 24 * 60 * 60 * 1000,
      windowEndMs: now.getTime() + 25 * 60 * 60 * 1000,
      variant: 'veille',
      clientFlagCol: 'reminder_email_sent_at',
      sessionFlagCol: 'reminder_sent_at',
      results,
    });

    // ===== PASSE 1bis : Rappel court, fenetre 1h a 2h avant la seance =====
    // Couvre aussi les reservations de derniere minute (delai mini 2h).
    await runReminderPass({
      windowStartMs: now.getTime() + 1 * 60 * 60 * 1000,
      windowEndMs: now.getTime() + 2 * 60 * 60 * 1000,
      variant: 'proche',
      clientFlagCol: 'reminder_soon_email_sent_at',
      sessionFlagCol: 'reminder_soon_sent_at',
      results,
    });

    // ===== PASSE 2 : Post-séance (J+1) =====
    const from30h = new Date(now.getTime() - 30 * 60 * 60 * 1000);
    const from6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const { data: pastRes, error: errPast } = await supabase
      .from('reservations')
      .select(`
        id, client_email, client_name, lang, status,
        post_session_email_sent_at,
        session:session_id (scheduled_at),
        praticien:praticien_id (prenom),
        pratique:pratique_id (nom)
      `)
      .in('status', ['confirmed', 'paid', 'completed'])
      .is('post_session_email_sent_at', null)
      .not('session_id', 'is', null);

    if (errPast) throw new Error(`Fetch past: ${errPast.message}`);

    const duePast = (pastRes ?? []).filter((r: any) => {
      if (!r.session?.scheduled_at) return false;
      const t = new Date(r.session.scheduled_at).getTime();
      return t >= from30h.getTime() && t <= from6h.getTime();
    });

    for (const r of duePast) {
      try {
        const lang = (r.lang as 'fr' | 'en') ?? 'fr';

        await sendEmail(
          r.client_email,
          lang === 'en' ? 'A little word after your session' : 'Un petit mot après votre séance',
          followupClientHTML({
            clientPrenom: firstName(r.client_name),
            praticienPrenom: r.praticien.prenom,
            sessionType: r.pratique.nom,
            lang,
          })
        );

        await supabase
          .from('reservations')
          .update({ post_session_email_sent_at: new Date().toISOString() })
          .eq('id', r.id);

        results.followups_sent++;
      } catch (e) {
        results.errors.push(`Followup ${r.id}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message, results }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});