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
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });
}

function formatDateEN(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });
}

function firstName(fullName: string | null): string {
  if (!fullName) return '';
  return fullName.split(' ')[0];
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
}) {
  if (p.lang === 'en') {
    return `
      ${FONT_IMPORT}
      <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
        <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">Reminder: your session tomorrow</h2>
        <p>Hi ${p.clientPrenom},</p>
        <p>A friendly reminder about your upcoming session with <strong>${p.praticienPrenom} ${p.praticienNom}</strong>.</p>
        <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
          <p style="margin: 0 0 8px;">${p.dateStr}</p>
          <p style="margin: 0;">Duration: ${p.duration} minutes</p>
        </div>
        <p>The video room opens 15 minutes before the session starts.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Join the session</a>
        </p>
        <p style="color: #888; font-size: 13px;">See you soon,<br>The Idala team</p>
      </div>
    `;
  }
  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">Rappel : votre séance demain</h2>
      <p>Bonjour ${p.clientPrenom},</p>
      <p>Petit rappel de votre séance à venir avec <strong>${p.praticienPrenom} ${p.praticienNom}</strong>.</p>
      <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
        <p style="margin: 0 0 8px;">${p.dateStr}</p>
        <p style="margin: 0;">Durée : ${p.duration} minutes</p>
      </div>
      <p>La salle de visio s'ouvre 15 minutes avant le début de la séance.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Rejoindre la séance</a>
      </p>
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
}) {
  const notesBlock = p.clientNotes.length > 0
    ? `
      <div style="background: #fdf9f2; border-left: 3px solid #c9a961; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #888;">Notes des clients</p>
        ${p.clientNotes.map(n => `<p style="margin: 0 0 8px; font-style: italic;">${n}</p>`).join('')}
      </div>
    `
    : '';

  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">Rappel : séance demain</h2>
      <p>Bonjour ${p.praticienPrenom},</p>
      <p>Rappel de votre séance à venir : <strong>${p.clientsInfo}</strong>.</p>
      <div style="background: #f7f4fa; border-left: 3px solid #6b4a8a; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px;"><strong>${p.sessionType}</strong></p>
        <p style="margin: 0 0 8px;">${p.dateStr}</p>
        <p style="margin: 0;">Durée : ${p.duration} minutes</p>
      </div>
      ${notesBlock}
      <p>La salle de visio s'ouvre 15 minutes avant le début de la séance.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${p.visioUrl}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à la séance</a>
      </p>
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
        <p>Hi ${p.clientPrenom},</p>
        <p>I hope your ${p.sessionType} session with ${p.praticienPrenom} yesterday brought you what you were looking for.</p>
        <p>If you enjoyed the experience, a Google review would help us a lot to reach other people in search of care.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${GOOGLE_REVIEW_URL}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a review</a>
        </p>
        <p>Thank you, see you soon.</p>
        <p style="color: #888; font-size: 13px;">The Idala team</p>
      </div>
    `;
  }
  return `
    ${FONT_IMPORT}
    <div style="font-family: ${BODY_FONT}; max-width: 560px; margin: 0 auto; color: #2b2b2b; line-height: 1.6;">
      <h2 style="font-family: ${TITLE_FONT}; color: #6b4a8a; font-weight: 500;">Un petit mot après votre séance</h2>
      <p>Bonjour ${p.clientPrenom},</p>
      <p>J'espère que votre séance de ${p.sessionType} avec ${p.praticienPrenom} hier vous a apporté ce que vous cherchiez.</p>
      <p>Si vous avez apprécié ce moment, un avis Google nous aiderait beaucoup à faire connaître Idala à d'autres personnes en recherche.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${GOOGLE_REVIEW_URL}" style="font-family: ${BODY_FONT}; background: #6b4a8a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Laisser un avis</a>
      </p>
      <p>Merci, à très vite.</p>
      <p style="color: #888; font-size: 13px;">L'équipe Idala</p>
    </div>
  `;
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
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // ===== PASSE 1 : Rappels J-1 =====
    const { data: upcomingRes, error: errUp } = await supabase
      .from('reservations')
      .select(`
        id, client_email, client_name, lang, notes_client, status,
        reminder_email_sent_at,
        session:session_id (
          id, scheduled_at, duration_minutes,
          praticien_join_secret, reminder_sent_at
        ),
        praticien:praticien_id (prenom, nom, email),
        pratique:pratique_id (nom)
      `)
      .in('status', ['confirmed', 'paid'])
      .is('reminder_email_sent_at', null)
      .not('session_id', 'is', null);

    if (errUp) throw new Error(`Fetch reservations: ${errUp.message}`);

    const dueReservations = (upcomingRes ?? []).filter((r: any) => {
      if (!r.session?.scheduled_at) return false;
      const t = new Date(r.session.scheduled_at).getTime();
      return t >= in24h.getTime() && t < in25h.getTime();
    });

    // Groupement par session pour le mail praticien (une fois par séance)
    const bySession = new Map<string, any[]>();
    for (const r of dueReservations) {
      const sid = r.session.id;
      if (!bySession.has(sid)) bySession.set(sid, []);
      bySession.get(sid)!.push(r);
    }

    // Envoi mail client (un par réservation)
    for (const r of dueReservations) {
      try {
        const lang = (r.lang as 'fr' | 'en') ?? 'fr';
        const clientVisioUrl = `${SITE_URL}/#/seance/${r.session.id}?r=${r.id}`;
        const dateStr = lang === 'en'
          ? formatDateEN(r.session.scheduled_at)
          : formatDateFR(r.session.scheduled_at);

        await sendEmail(
          r.client_email,
          lang === 'en' ? 'Reminder: your session tomorrow' : 'Rappel : votre séance demain',
          reminderClientHTML({
            clientPrenom: firstName(r.client_name),
            praticienPrenom: r.praticien.prenom,
            praticienNom: r.praticien.nom,
            sessionType: r.pratique.nom,
            duration: r.session.duration_minutes,
            dateStr,
            visioUrl: clientVisioUrl,
            lang,
          })
        );

        await supabase
          .from('reservations')
          .update({ reminder_email_sent_at: new Date().toISOString() })
          .eq('id', r.id);

        results.client_reminders_sent++;
      } catch (e) {
        results.errors.push(`Client reminder ${r.id}: ${(e as Error).message}`);
      }
    }

    // Envoi mail praticien (un par séance, pas par réservation)
    for (const [sessionId, reservations] of bySession) {
      const first = reservations[0];
      if (first.session.reminder_sent_at) continue; // déjà envoyé

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
          })
        );

        await supabase
          .from('sessions')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', sessionId);

        results.praticien_reminders_sent++;
      } catch (e) {
        results.errors.push(`Praticien reminder ${sessionId}: ${(e as Error).message}`);
      }
    }

    // ===== PASSE 2 : Post-séance =====
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