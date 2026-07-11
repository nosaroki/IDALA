import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// ---- Mail de confirmation d'activation ----
async function sendProfileActiveEmail(prenom: string, email: string) {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>

      <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">
        Votre profil est en ligne, ${prenom} !
      </h1>

      <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
        Bonne nouvelle : la configuration de vos paiements est validée, et votre profil est désormais actif sur The Idala Family.
      </p>
      <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
        Vous pouvez dès maintenant recevoir des réservations. Les clients règlent leur séance en ligne, et vous percevez vos honoraires directement, après chaque séance.
      </p>

      <a href="https://theidalafamily.com"
        style="display:inline-block;padding:14px 32px;background:#3e295d;color:#fff;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
        Voir mon profil
      </a>

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

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Signature manquante', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Signature invalide: ${String(err)}`, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;
    const onboardingCompleted = chargesEnabled && payoutsEnabled && detailsSubmitted;

    // ---- Lire l'état AVANT mise à jour, pour détecter la bascule ----
    const { data: before } = await supabase
      .from('stripe_accounts')
      .select('onboarding_completed, praticien_id')
      .eq('stripe_account_id', account.id)
      .maybeSingle();

    const wasCompleted = before?.onboarding_completed ?? false;

    const { error } = await supabase
      .from('stripe_accounts')
      .update({
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
        onboarding_completed: onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id);

    if (error) {
      console.error('Erreur MAJ stripe_accounts:', error.message);
    }

    // ---- Bascule détectée : le compte vient de devenir complet ----
    if (!wasCompleted && onboardingCompleted && before?.praticien_id) {
      const { data: praticien } = await supabase
        .from('praticiens')
        .select('prenom, email')
        .eq('id', before.praticien_id)
        .single();

      if (praticien?.email) {
        await sendProfileActiveEmail(praticien.prenom, praticien.email);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});