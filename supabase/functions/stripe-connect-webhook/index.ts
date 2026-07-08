import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// Client de chiffrement pour vérifier la signature (Deno)
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  // Un webhook ne reçoit que du POST de Stripe. Pas de CORS navigateur.
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Signature manquante', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  // ---- Vérifier que la requête vient VRAIMENT de Stripe ----
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

  // ---- Traiter l'événement account.updated ----
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    // onboarding_completed = le praticien peut encaisser ET recevoir des virements
    const onboardingCompleted = chargesEnabled && payoutsEnabled && detailsSubmitted;

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
      // On log l'erreur mais on renvoie 200 pour que Stripe ne réessaie pas en boucle
      console.error('Erreur MAJ stripe_accounts:', error.message);
    }
  }

  // Toujours répondre 200 rapidement pour confirmer la réception à Stripe
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});