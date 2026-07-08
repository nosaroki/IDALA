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
    const { praticien_id, from, to, length_minutes } = await req.json();

    if (!praticien_id) {
      return jsonResponse({ error: 'praticien_id requis' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: praticien, error: pErr } = await supabase
      .from('praticiens')
      .select('supersaas_schedule_id')
      .eq('id', praticien_id)
      .single();

    if (pErr || !praticien?.supersaas_schedule_id) {
      return jsonResponse({ error: 'Agenda du praticien introuvable' }, 404);
    }

    const scheduleId = praticien.supersaas_schedule_id;

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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}