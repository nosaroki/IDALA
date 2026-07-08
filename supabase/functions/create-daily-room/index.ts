import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// CONFIG
// ============================================
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';

// Marges de sécurité (en minutes)
const OPEN_BEFORE_MIN = 15;   // room accessible 15 min avant le début
const MARGIN_AFTER_MIN = 60;  // room expire 60 min après la fin prévue

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
    // ---- 1. Lire le paramètre session_id ----
    const { session_id } = await req.json();

    if (!session_id) {
      return jsonResponse({ error: 'session_id manquant' }, 400);
    }

    // ---- 2. Client Supabase en service_role ----
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- 3. Lire la session ----
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, max_participants, mode_seance, daily_room_url')
      .eq('id', session_id)
      .single();

    if (fetchError || !session) {
      return jsonResponse({ error: 'Session introuvable' }, 404);
    }

    // ---- 4. Vérifier que la séance est en visio ----
    if (session.mode_seance !== 'visio') {
      return jsonResponse({
        error: 'Pas de room nécessaire',
        reason: `mode_seance = ${session.mode_seance} (room créée uniquement pour visio)`,
      }, 400);
    }

    // ---- 5. Anti-doublon : room déjà créée ? ----
    if (session.daily_room_url) {
      return jsonResponse({
        room_url: session.daily_room_url,
        already_existed: true,
      }, 200);
    }

    // ---- 6. Calcul des fenêtres temporelles ----
    const scheduledAt = new Date(session.scheduled_at);
    const durationMin = session.duration_minutes ?? 60;

    const nbf = Math.floor(
      (scheduledAt.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000
    );
    const exp = Math.floor(
      (scheduledAt.getTime() + (durationMin + MARGIN_AFTER_MIN) * 60 * 1000) / 1000
    );

    // ---- 7. Capacité de la room ----
    // Individuel (max 1) => 2 personnes (praticien + client)
    // Groupe (max N) => N + 1 (les participants + le praticien)
    const roomCapacity = (session.max_participants ?? 1) + 1;

    // ---- 8. Créer la room privée Daily.co ----
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
          nbf,
          exp,
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          max_participants: roomCapacity,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!roomRes.ok) {
      const errText = await roomRes.text();
      return jsonResponse({ error: 'Erreur création room Daily', details: errText }, 502);
    }

    const room = await roomRes.json();

    // ---- 9. Enregistrer dans la session ----
    const expiresAt = new Date(exp * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        daily_room_name: room.name,
        daily_room_url: room.url,
        daily_room_expires_at: expiresAt,
      })
      .eq('id', session.id);

    if (updateError) {
      return jsonResponse({ error: 'Erreur enregistrement', details: updateError.message }, 500);
    }

    // ---- 10. Réponse OK ----
    return jsonResponse({
      room_url: room.url,
      room_name: room.name,
      expires_at: expiresAt,
      capacity: roomCapacity,
      already_existed: false,
    }, 200);

  } catch (err) {
    return jsonResponse({ error: 'Erreur serveur', details: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}