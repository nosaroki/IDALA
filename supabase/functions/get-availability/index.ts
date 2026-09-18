import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPERSAAS_API_KEY = Deno.env.get('SUPERSAAS_API_KEY')!;
const SUPERSAAS_ACCOUNT = Deno.env.get('SUPERSAAS_ACCOUNT')!;

const SUPERSAAS_BASE = 'https://www.supersaas.com/api';
const MAX_MONTHS_AHEAD = 3;

// SuperSaaS plafonne /free autour de 200 résultats par appel.
// Pour couvrir un mois dense, on pagine en tranches de quelques jours.
const CHUNK_DAYS = 5;         // taille d'une tranche
const MAXRESULTS_PER_CALL = 200;
const MAX_CHUNKS = 8;         // garde-fou (8 x 5 = 40 jours max couverts)

// Traduction convention offre (modes.jsx : visio / home / in-person)
// vers la convention stockée dans la table sessions (visio / domicile / cabinet).
const MODE_TO_SESSION: Record<string, string> = {
  visio: 'visio',
  home: 'domicile',
  'in-person': 'cabinet',
};

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
    const { praticien_id, schedule_id, offre_id, from, to, length_minutes } = await req.json();

    if (!praticien_id && !schedule_id) {
      return jsonResponse({ error: 'praticien_id ou schedule_id requis' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let scheduleId: string;

    if (schedule_id) {
      // Agenda direct (ex: diagnostic), pas lié à un praticien
      scheduleId = String(schedule_id);
    } else {
      const { data: praticien, error: pErr } = await supabase
        .from('praticiens')
        .select('supersaas_schedule_id')
        .eq('id', praticien_id)
        .single();

      if (pErr || !praticien?.supersaas_schedule_id) {
        return jsonResponse({ error: 'Agenda du praticien introuvable' }, 404);
      }
      scheduleId = praticien.supersaas_schedule_id;
    }

    // ---- Bornes ----
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + MAX_MONTHS_AHEAD);

    let fromDate = from ? new Date(from) : new Date(now);
    if (fromDate < now) fromDate = new Date(now);

    let toDate: Date;
    if (to) {
      toDate = new Date(to);
    } else {
      toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0, 23, 59, 59);
    }
    if (toDate > maxDate) toDate = maxDate;

    if (fromDate > maxDate) {
      return jsonResponse({ slots: [], count: 0, capped: true, max_date: maxDate.toISOString() }, 200);
    }

    // ---- Pagination par tranches ----
    const allSlots: { start: string; finish: string }[] = [];
    const seen = new Set<string>();
    let chunkStart = new Date(fromDate);
    let chunks = 0;

    while (chunkStart <= toDate && chunks < MAX_CHUNKS) {
      chunks++;

      const params = new URLSearchParams({
        account: SUPERSAAS_ACCOUNT,
        api_key: SUPERSAAS_API_KEY,
        schedule_id: scheduleId,
        from: toSuperSaasDate(chunkStart),
        maxresults: String(MAXRESULTS_PER_CALL),
      });
      if (length_minutes) params.set('length', String(length_minutes));

      const url = `${SUPERSAAS_BASE}/free/${scheduleId}.json?${params.toString()}`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        // On renvoie ce qu'on a pu récupérer plutôt que d'échouer complètement
        break;
      }

      const data = await res.json();
      const slots = data.slots || [];

      if (slots.length === 0) break; // plus rien de dispo, inutile de continuer

      let lastStart: Date | null = null;
      for (const s of slots) {
        const st = new Date(s.start);
        lastStart = st;
        if (st < fromDate || st > toDate) continue;
        if (!seen.has(s.start)) {
          seen.add(s.start);
          allSlots.push({ start: s.start, finish: s.finish });
        }
      }

      // Avance la tranche : soit CHUNK_DAYS après le début courant,
      // soit juste après le dernier créneau reçu (le plus loin des deux)
      const nextByDays = new Date(chunkStart);
      nextByDays.setDate(nextByDays.getDate() + CHUNK_DAYS);

      if (lastStart && lastStart > nextByDays) {
        chunkStart = new Date(lastStart.getTime() + 60 * 1000); // 1 min après le dernier
      } else {
        chunkStart = nextByDays;
      }
    }

    // ---- Réinjection des sessions collectives ouvertes ----
    // Un cours de groupe déjà démarré est "pris" côté SuperSaaS (ressource unique),
    // donc absent des créneaux libres ci-dessus. Tant qu'il reste de la place, le
    // créneau doit rester visible pour les participants suivants. On lit ces sessions
    // en base et on les repasse au format des créneaux SuperSaaS ("2026-09-20T16:00").
    // Ne se déclenche que pour une offre collective (max_participants > 1).
    if (offre_id) {
      try {
        const { data: offre } = await supabase
          .from('praticien_offres')
          .select('duree, mode_seance, max_participants, praticien_pratiques(praticien_id, pratique_id)')
          .eq('id', offre_id)
          .single();

        const maxParticipants = offre?.max_participants ? Number(offre.max_participants) : 1;

        if (offre && maxParticipants > 1) {
          const ppRel = Array.isArray(offre.praticien_pratiques)
            ? offre.praticien_pratiques[0]
            : offre.praticien_pratiques;
          const sessionMode = MODE_TO_SESSION[offre.mode_seance] || offre.mode_seance;
          const durationMin = offre.duree ? parseInt(String(offre.duree), 10) : 60;

          if (ppRel?.praticien_id && ppRel?.pratique_id) {
            const { data: openSessions } = await supabase
              .from('sessions')
              .select('scheduled_at, booked_count, max_participants, status')
              .eq('praticien_id', ppRel.praticien_id)
              .eq('pratique_id', ppRel.pratique_id)
              .eq('mode_seance', sessionMode)
              .eq('status', 'open')
              .gte('scheduled_at', fromDate.toISOString())
              .lte('scheduled_at', toDate.toISOString());

            for (const sess of openSessions || []) {
              // Place restante : on ne remet le créneau que s'il reste des places.
              if (sess.booked_count >= sess.max_participants) continue;

              const startDate = new Date(sess.scheduled_at);
              if (startDate < fromDate || startDate > toDate) continue;

              // scheduled_at est un instant UTC : on le repasse en heure murale de Paris
              // pour coller au format SuperSaaS renvoyé plus haut.
              const startParis = utcToParisWall(sess.scheduled_at);
              if (!startParis) continue;

              const finishDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
              const finishParis = utcToParisWall(finishDate.toISOString());

              if (!seen.has(startParis)) {
                seen.add(startParis);
                allSlots.push({ start: startParis, finish: finishParis || startParis });
              }
            }
          }
        }
      } catch (e) {
        // On n'échoue pas la disponibilité pour autant : on renvoie au moins les créneaux SuperSaaS.
        console.error('Erreur réinjection sessions collectives:', String(e));
      }
    }

    // Tri chronologique
    allSlots.sort((a, b) => a.start.localeCompare(b.start));

    return jsonResponse({
      slots: allSlots,
      count: allSlots.length,
      from: toSuperSaasDate(fromDate),
      to: toSuperSaasDate(toDate),
      max_date: maxDate.toISOString(),
    }, 200);

  } catch (err) {
    return jsonResponse({ error: 'Erreur serveur', details: String(err) }, 500);
  }
});

function toSuperSaasDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Instant UTC ("2026-09-20T14:00:00.000Z") vers heure murale de Paris ("2026-09-20T16:00").
// Format aligné sur les créneaux SuperSaaS, pour que le front les traite à l'identique.
function utcToParisWall(utcIso: string): string | null {
  try {
    const d = new Date(utcIso);
    if (isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
    let hour = get('hour');
    if (hour === '24') hour = '00';
    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}