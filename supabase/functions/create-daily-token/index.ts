import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DAILY_API_BASE = 'https://api.daily.co/v1';

const OPEN_BEFORE_MIN = 15;
const MARGIN_AFTER_MIN = 60;

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
    const payload = await req.json();
    const session_id = payload.session_id;
    const reservation_id = payload.reservation_id ?? null;

    // Le secret praticien peut arriver sous deux noms selon l'appelant.
    const pratSecret = payload.praticien_join_secret ?? payload.praticien_secret ?? null;

    // Le role est deduit s'il n'est pas fourni : un secret praticien present
    // designe un praticien, sinon un reservation_id designe un client.
    const role = payload.role ?? (pratSecret ? 'praticien' : (reservation_id ? 'client' : null));

    if (!session_id) {
      return jsonResponse({ error: 'INVALID_ACCESS' }, 400);
    }
    if (role !== 'praticien' && role !== 'client') {
      return jsonResponse({ error: 'INVALID_ACCESS' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- Lire la session ----
    const { data: session, error: sErr } = await supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, mode_seance, daily_room_name, daily_room_url, praticien_id, praticien_join_secret')
      .eq('id', session_id)
      .single();

    if (sErr || !session) {
      return jsonResponse({ error: 'INVALID_ACCESS' }, 404);
    }
    if (session.mode_seance !== 'visio') {
      return jsonResponse({ error: 'NO_ROOM' }, 400);
    }
    if (!session.daily_room_name) {
      return jsonResponse({ error: 'NO_ROOM' }, 400);
    }

    // ---- Fenetre temporelle ----
    const scheduledAt = new Date(session.scheduled_at);
    const durationMin = session.duration_minutes ?? 60;
    const nbf = Math.floor((scheduledAt.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000);
    const exp = Math.floor((scheduledAt.getTime() + (durationMin + MARGIN_AFTER_MIN) * 60 * 1000) / 1000);
    const now = Math.floor(Date.now() / 1000);

    if (now < nbf) {
      return jsonResponse({ error: 'TOO_EARLY', opens_at: new Date(nbf * 1000).toISOString() }, 403);
    }
    if (now > exp) {
      return jsonResponse({ error: 'SESSION_ENDED' }, 403);
    }

    // ---- Determiner identite + droits selon le role ----
    let isOwner = false;
    let userName = 'Participant';

    if (role === 'praticien') {
      if (!pratSecret || pratSecret !== session.praticien_join_secret) {
        return jsonResponse({ error: 'INVALID_ACCESS' }, 403);
      }
      isOwner = true;

      const { data: prat } = await supabase
        .from('praticiens')
        .select('prenom, nom')
        .eq('id', session.praticien_id)
        .single();

      userName = prat ? formatName(prat.prenom, prat.nom) : 'Praticien';

    } else {
      // role === 'client'
      if (!reservation_id) {
        return jsonResponse({ error: 'INVALID_ACCESS' }, 400);
      }

      const { data: resa } = await supabase
        .from('reservations')
        .select('id, client_name, status, session_id')
        .eq('id', reservation_id)
        .single();

      if (!resa || resa.session_id !== session_id) {
        return jsonResponse({ error: 'INVALID_ACCESS' }, 403);
      }
      if (resa.status !== 'confirmed') {
        return jsonResponse({ error: 'RESERVATION_NOT_CONFIRMED' }, 403);
      }

      isOwner = false;
      userName = formatFullName(resa.client_name);
    }

    // ---- Generer le meeting token Daily ----
    const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: session.daily_room_name,
          is_owner: isOwner,
          user_name: userName,
          exp,
          eject_at_token_exp: true,
        },
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Erreur creation token Daily:', errText);
      return jsonResponse({ error: 'GENERIC' }, 502);
    }

    const tokenData = await tokenRes.json();

    // URL prete a l'emploi (room + token)
    const joinUrl = `${session.daily_room_url}?t=${tokenData.token}`;

    return jsonResponse({
      token: tokenData.token,
      join_url: joinUrl,
      user_name: userName,
      is_owner: isOwner,
    }, 200);

  } catch (err) {
    console.error('Erreur create-daily-token:', String(err));
    return jsonResponse({ error: 'GENERIC' }, 500);
  }
});

// Nom praticien : "Prenom N."
function formatName(prenom: string, nom: string): string {
  const p = (prenom ?? '').trim();
  const n = (nom ?? '').trim();
  return n ? `${p} ${n[0].toUpperCase()}.` : p;
}

// Nom client (champ unique) : "Prenom N."
function formatFullName(fullName: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return 'Participant';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// V1
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
// const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// const DAILY_API_BASE = 'https://api.daily.co/v1';

// const OPEN_BEFORE_MIN = 15;
// const MARGIN_AFTER_MIN = 60;

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// };

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const { session_id, role, reservation_id, praticien_secret } = await req.json();

//     if (!session_id || !role) {
//       return jsonResponse({ error: 'session_id et role requis' }, 400);
//     }
//     if (role !== 'praticien' && role !== 'client') {
//       return jsonResponse({ error: 'role invalide (praticien ou client)' }, 400);
//     }

//     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

//     // ---- Lire la session ----
//     const { data: session, error: sErr } = await supabase
//       .from('sessions')
//       .select('id, scheduled_at, duration_minutes, mode_seance, daily_room_name, daily_room_url, praticien_id, praticien_join_secret')
//       .eq('id', session_id)
//       .single();

//     if (sErr || !session) {
//       return jsonResponse({ error: 'Session introuvable' }, 404);
//     }
//     if (session.mode_seance !== 'visio') {
//       return jsonResponse({ error: 'Cette seance n\'est pas en visio' }, 400);
//     }
//     if (!session.daily_room_name) {
//       return jsonResponse({ error: 'Aucune room pour cette session' }, 400);
//     }

//     // ---- Fenetre temporelle ----
//     const scheduledAt = new Date(session.scheduled_at);
//     const durationMin = session.duration_minutes ?? 60;
//     const nbf = Math.floor((scheduledAt.getTime() - OPEN_BEFORE_MIN * 60 * 1000) / 1000);
//     const exp = Math.floor((scheduledAt.getTime() + (durationMin + MARGIN_AFTER_MIN) * 60 * 1000) / 1000);
//     const now = Math.floor(Date.now() / 1000);

//     if (now < nbf) {
//       return jsonResponse({ error: 'Trop tot', reason: 'La seance ouvre 15 min avant l\'heure', opens_at: new Date(nbf * 1000).toISOString() }, 403);
//     }
//     if (now > exp) {
//       return jsonResponse({ error: 'Seance terminee', reason: 'La room a expire' }, 403);
//     }

//     // ---- Determiner identite + droits selon le role ----
//     let isOwner = false;
//     let userName = 'Participant';

//     if (role === 'praticien') {
//       if (!praticien_secret || praticien_secret !== session.praticien_join_secret) {
//         return jsonResponse({ error: 'Acces praticien non autorise' }, 403);
//       }
//       isOwner = true;

//       const { data: prat } = await supabase
//         .from('praticiens')
//         .select('prenom, nom')
//         .eq('id', session.praticien_id)
//         .single();

//       userName = prat ? formatName(prat.prenom, prat.nom) : 'Praticien';

//     } else {
//       // role === 'client'
//       if (!reservation_id) {
//         return jsonResponse({ error: 'reservation_id requis pour un client' }, 400);
//       }

//       const { data: resa } = await supabase
//         .from('reservations')
//         .select('id, client_name, status, session_id')
//         .eq('id', reservation_id)
//         .single();

//       if (!resa || resa.session_id !== session_id) {
//         return jsonResponse({ error: 'Reservation invalide pour cette session' }, 403);
//       }
//       if (resa.status !== 'confirmed') {
//         return jsonResponse({ error: 'Reservation non confirmee (paiement requis)' }, 403);
//       }

//       isOwner = false;
//       userName = formatFullName(resa.client_name);
//     }

//     // ---- Generer le meeting token Daily ----
//     const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${DAILY_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         properties: {
//           room_name: session.daily_room_name,
//           is_owner: isOwner,
//           user_name: userName,
//           exp,
//           eject_at_token_exp: true,
//         },
//       }),
//     });

//     if (!tokenRes.ok) {
//       const errText = await tokenRes.text();
//       return jsonResponse({ error: 'Erreur creation token Daily', details: errText }, 502);
//     }

//     const tokenData = await tokenRes.json();

//     // URL prete a l'emploi (room + token)
//     const joinUrl = `${session.daily_room_url}?t=${tokenData.token}`;

//     return jsonResponse({
//       token: tokenData.token,
//       join_url: joinUrl,
//       user_name: userName,
//       is_owner: isOwner,
//     }, 200);

//   } catch (err) {
//     return jsonResponse({ error: 'Erreur serveur', details: String(err) }, 500);
//   }
// });

// // Nom praticien : "Prenom N."
// function formatName(prenom: string, nom: string): string {
//   const p = (prenom ?? '').trim();
//   const n = (nom ?? '').trim();
//   return n ? `${p} ${n[0].toUpperCase()}.` : p;
// }

// // Nom client (champ unique) : "Prenom N."
// function formatFullName(fullName: string): string {
//   const parts = (fullName ?? '').trim().split(/\s+/);
//   if (parts.length === 0 || parts[0] === '') return 'Participant';
//   if (parts.length === 1) return parts[0];
//   const first = parts[0];
//   const lastInitial = parts[parts.length - 1][0].toUpperCase();
//   return `${first} ${lastInitial}.`;
// }

// function jsonResponse(body: unknown, status: number) {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   });
// }