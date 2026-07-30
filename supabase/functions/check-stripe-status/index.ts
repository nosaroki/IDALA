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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return json({ error: 'MISSING_TOKEN' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Retrouver le praticien via son token d'onboarding.
    // On lit aussi actif et supersaas_agenda_url, necessaires pour la bascule.
    const { data: praticien } = await supabase
      .from('praticiens')
      .select('id, prenom, email, actif, welcome_email_sent, supersaas_agenda_url')
      .eq('onboarding_token', token)
      .single();

    // Token inconnu : la page affichera "lien invalide"
    if (!praticien) {
      return json({ found: false, completed: false }, 200);
    }

    // Compte Stripe rattache ?
    const { data: sa } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('praticien_id', praticien.id)
      .maybeSingle();

    // Pas encore de compte : onboarding pas commence
    if (!sa?.stripe_account_id) {
      return json({ found: true, completed: false, prenom: praticien.prenom }, 200);
    }

    // Etat reel lu directement chez Stripe, sans dependre du webhook ni de la base.
    const account = await stripe.accounts.retrieve(sa.stripe_account_id);
    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;
    const completed = chargesEnabled && detailsSubmitted;
    const onboardingCompleted = chargesEnabled && payoutsEnabled && detailsSubmitted;

    // On tient stripe_accounts a jour a chaque passage, sans dependre du webhook.
    await supabase
      .from('stripe_accounts')
      .update({
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
        onboarding_completed: onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('praticien_id', praticien.id);

    // ---- Activation : le compte est complet et le praticien n'est pas encore actif ----
    if (onboardingCompleted && praticien.actif === false) {
      const { error: activationError } = await supabase
        .from('praticiens')
        .update({ actif: true })
        .eq('id', praticien.id);
      if (activationError) {
        console.error('Erreur activation praticien:', activationError.message);
      }
    }

    // ---- Mail de bienvenue : une seule fois, base sur welcome_email_sent, pas sur actif ----
    // On bascule welcome_email_sent de false a true de facon atomique. Si la mise a jour
    // touche une ligne, c'est nous qui l'avons fait passer, donc on envoie. Si elle n'en
    // touche aucune, le mail est deja parti, on n'envoie pas de doublon. Ce verrou tient
    // meme quand la page appelle cette fonction plusieurs fois en polling.
    if (onboardingCompleted && praticien.welcome_email_sent === false) {
      const { data: flipped } = await supabase
        .from('praticiens')
        .update({ welcome_email_sent: true })
        .eq('id', praticien.id)
        .eq('welcome_email_sent', false)
        .select('id');

      if (flipped && flipped.length > 0 && praticien.email) {
        await sendProfileActiveEmail(
          praticien.prenom,
          praticien.email,
          praticien.supersaas_agenda_url || null
        );
        if (!praticien.supersaas_agenda_url) {
          await notifyMissingAgenda(praticien.prenom, praticien.id);
        }
      }
    }

    // Reponse au front : contrat inchange (found, completed, prenom).
    return json({
      found: true,
      completed,
      charges_enabled: chargesEnabled,
      details_submitted: detailsSubmitted,
      prenom: praticien.prenom,
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