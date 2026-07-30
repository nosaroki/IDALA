import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---- Mail de bienvenue : profil actif + acces a l'agenda ----
// Repris tel quel de stripe-connect-webhook, aucune modification.
async function sendProfileActiveEmail(prenom: string, email: string, agendaUrl: string | null) {
  const agendaBlock = agendaUrl ? `
      <div style="margin-top: 8px; padding: 24px; background: #F7F2FE; border: 1px solid #E4D8F5; border-radius: 12px;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin: 0 0 12px;">Votre agenda</p>
        <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin: 0 0 12px;">
          Votre agenda personnel est prêt. Vous gérez vous-même vos disponibilités : ouvrez votre agenda, bloquez les créneaux où vous n'êtes pas disponible. Le reste est proposé automatiquement à la réservation.
        </p>
        <p style="font-size: 13px; line-height: 1.8; font-weight: 300; margin: 0 0 20px; color: #6B5B7E;">
          Pour y accéder, connectez-vous avec votre adresse email. À votre première connexion, définissez votre mot de passe via « Mot de passe oublié ».
        </p>
        <a href="${agendaUrl}"
          style="display:inline-block;padding:12px 28px;background:#9B6EBF;color:#fff;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
          Accéder à mon agenda
        </a>
      </div>` : '';

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>

      <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">
        Votre profil est en ligne, ${prenom} !
      </h1>

      <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
        Bonne nouvelle : la configuration de vos paiements est validée, votre profil est désormais actif sur The Idala Family.
      </p>
      <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 28px;">
        Vous pouvez dès maintenant recevoir des réservations. Les clients règlent leur séance en ligne. Vous percevez vos honoraires directement après chaque séance.
      </p>

      <a href="https://theidalafamily.com"
        style="display:inline-block;padding:14px 32px;background:#3e295d;color:#fff;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
        Voir mon profil
      </a>

      ${agendaBlock ? `<div style="margin-top: 32px;">${agendaBlock}</div>` : ''}

      <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-top: 40px;">
        Bien à vous,<br/>The Idala Family
      </p>

      <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 40px 0 24px;" />
      <div style="text-align: center;">
        <img src="https://theidalafamily.com/newlogo.png" alt="The Idala Family" style="width: 80px; height: auto; margin-bottom: 12px;" />
        <p style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
          <a href="https://theidalafamily.com" style="color: #9B6EBF; text-decoration: none;">theidalafamily.com</a>
        </p>
      </div>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: email,
      subject: 'Votre profil est en ligne | The Idala Family',
      html,
    }),
  });

  if (!res.ok) {
    console.error('Erreur envoi mail activation:', await res.text());
  }
}

// ---- Notification interne quand l'agenda n'est pas encore renseigne ----
// Repris tel quel de stripe-connect-webhook.
async function notifyMissingAgenda(prenom: string, praticienId: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Idala Family <contact@theidalafamily.com>',
        to: 'contact@theidalafamily.com',
        subject: `Agenda à renseigner : ${prenom}`,
        html: `<p style="font-family: Georgia, serif; color: #281745;">
          ${prenom} vient de valider son compte Stripe et son profil est actif, mais son agenda SuperSaaS n'est pas encore renseigné (supersaas_agenda_url vide, id praticien ${praticienId}).<br/><br/>
          Le mail de bienvenue est parti sans le lien de l'agenda. Pense à créer son agenda, renseigner son URL en base, puis à lui transmettre le lien.
        </p>`,
      }),
    });
  } catch (e) {
    console.error('Erreur notif agenda manquant:', String(e));
  }
}

// ---- Synchronise un praticien depuis Stripe ----
// On lit l'etat du compte via l'API (pas via un evenement), on met la base a jour,
// on active le praticien si son Stripe est complet, puis on envoie le mail de bienvenue.
// force = true renvoie le mail meme si le praticien est deja actif (utile pour un test).
async function syncOne(supabase: any, praticienId: string, force = false) {
  const { data: sa } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id')
    .eq('praticien_id', praticienId)
    .maybeSingle();

  if (!sa?.stripe_account_id) {
    return { praticien_id: praticienId, status: 'pas_de_compte_stripe' };
  }

  const account = await stripe.accounts.retrieve(sa.stripe_account_id);
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const detailsSubmitted = account.details_submitted ?? false;
  const onboardingCompleted = chargesEnabled && payoutsEnabled && detailsSubmitted;

  const { data: prat } = await supabase
    .from('praticiens')
    .select('prenom, email, actif, welcome_email_sent, supersaas_agenda_url')
    .eq('id', praticienId)
    .single();

  await supabase
    .from('stripe_accounts')
    .update({
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      onboarding_completed: onboardingCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('praticien_id', praticienId);

  const wasActive = prat?.actif ?? false;
  let activated = false;
  let emailSent = false;

  // Activation si le compte est complet et le praticien pas encore actif.
  if (onboardingCompleted && !wasActive) {
    await supabase.from('praticiens').update({ actif: true }).eq('id', praticienId);
    activated = true;
  }

  // Mail de bienvenue : une seule fois via welcome_email_sent.
  // force = true reenvoie meme si le mail est deja parti (usage admin, rattrapage).
  // Sinon, verrou atomique : on ne l'envoie que si on fait passer le flag de false a true.
  if (onboardingCompleted && prat?.email) {
    let shouldSend = false;

    if (force) {
      shouldSend = true;
      await supabase.from('praticiens').update({ welcome_email_sent: true }).eq('id', praticienId);
    } else {
      const { data: flipped } = await supabase
        .from('praticiens')
        .update({ welcome_email_sent: true })
        .eq('id', praticienId)
        .eq('welcome_email_sent', false)
        .select('id');
      shouldSend = !!(flipped && flipped.length > 0);
    }

    if (shouldSend) {
      await sendProfileActiveEmail(prat.prenom, prat.email, prat.supersaas_agenda_url || null);
      emailSent = true;
      if (!prat.supersaas_agenda_url) {
        await notifyMissingAgenda(prat.prenom, praticienId);
      }
    }
  }

  return {
    praticien_id: praticienId,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    details_submitted: detailsSubmitted,
    onboarding_completed: onboardingCompleted,
    activated,
    email_sent: emailSent,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Mode lot : synchronise tous les praticiens ayant un compte Stripe.
    // Les deja actifs ne sont pas re-emailes (force reste false).
    if (body.all === true) {
      const { data: rows } = await supabase
        .from('stripe_accounts')
        .select('praticien_id');

      const results = [];
      for (const r of rows ?? []) {
        try {
          results.push(await syncOne(supabase, r.praticien_id, false));
        } catch (e) {
          results.push({ praticien_id: r.praticien_id, error: String(e) });
        }
      }
      return json({ results }, 200);
    }

    // Mode unitaire.
    if (!body.praticien_id) {
      return json({ error: 'praticien_id requis (ou all: true)' }, 400);
    }
    const result = await syncOne(supabase, body.praticien_id, body.force === true);
    return json(result, 200);
  } catch (err) {
    return json({ error: 'Erreur serveur', details: String(err) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}