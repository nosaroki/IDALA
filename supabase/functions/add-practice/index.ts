import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'photos-praticiens'

// Le format découle des modes des offres, seule source de vérité.
function modesFromOffres(offres: any[]): string {
  return [...new Set((offres || []).map((o: any) => o.mode_seance).filter(Boolean))].join(', ')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { praticien_id, pratiques_details, lang } = await req.json()

    if (!praticien_id || !pratiques_details) {
      return json({ error: 'MISSING_FIELDS' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // ---- Praticien concerné (déjà actif) ----
    const { data: praticien, error: pErr } = await supabase
      .from('praticiens')
      .select('id, prenom, nom, email, slug, mode_exercice')
      .eq('id', praticien_id)
      .single()

    if (pErr || !praticien) {
      return json({ error: 'PRACTITIONER_NOT_FOUND' }, 404)
    }

    const slugs = Object.keys(pratiques_details)
    if (slugs.length === 0) {
      return json({ error: 'NO_PRACTICE' }, 400)
    }

    const { data: pratiquesData } = await supabase
      .from('pratiques')
      .select('id, slug, nom')
      .in('slug', slugs)

    // ---- Helpers copie photo : candidatures/{uuid}/ -> praticiens/{slug}/ ----
    function urlToStoragePath(url: string): string | null {
      const marker = `/object/public/${BUCKET}/`
      const idx = url.indexOf(marker)
      if (idx === -1) return null
      return url.substring(idx + marker.length).split('?')[0]
    }

    async function copyPhotoToPraticien(oldUrl: string, slugLocal: string): Promise<string> {
      const oldPath = urlToStoragePath(oldUrl)
      if (!oldPath) return oldUrl
      const filename = oldPath.split('/').pop() || `photo-${Date.now()}.jpg`
      const newPath = `praticiens/${slugLocal}/${filename}`
      const { error: copyError } = await supabase.storage.from(BUCKET).copy(oldPath, newPath)
      if (copyError) {
        if (copyError.message?.includes('already exists')) {
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
          return data.publicUrl
        }
        console.error('Erreur copie photo:', copyError.message)
        return oldUrl
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
      return data.publicUrl
    }

    // ---- Ajout des pratiques (anti-doublon), immédiat ----
    const ajoutees: string[] = []
    const modesAjoutes: string[] = []

    for (const pratique of (pratiquesData || [])) {
      const details = pratiques_details[pratique.slug] || {}

      const { data: existingPP } = await supabase
        .from('praticien_pratiques')
        .select('id')
        .eq('praticien_id', praticien.id)
        .eq('pratique_id', pratique.id)
        .maybeSingle()

      if (existingPP) continue

      let pratiquePhotoUrl: string | null = null
      if (details.photo_url) {
        pratiquePhotoUrl = await copyPhotoToPraticien(details.photo_url, praticien.slug)
      }

      const modePratique = modesFromOffres(details.offres)

      const { data: newPP } = await supabase
        .from('praticien_pratiques')
        .insert({
          praticien_id: praticien.id,
          pratique_id: pratique.id,
          bio_fr: details.bio_fr || '',
          bio_en: details.bio_en || '',
          public_cible: details.public_cible || '',
          type_seance: details.type_seance || '',
          mode_exercice: modePratique,
          photo_url: pratiquePhotoUrl,
        })
        .select()
        .single()

      if (newPP && details.offres?.length > 0) {
        for (let i = 0; i < details.offres.length; i++) {
          const offre = details.offres[i]
          await supabase.from('praticien_offres').insert({
            praticien_pratique_id: newPP.id,
            titre_fr: offre.titre_fr || '',
            titre_en: offre.titre_en || '',
            description_fr: offre.description_fr || '',
            description_en: offre.description_en || '',
            prix: offre.prix ? parseFloat(offre.prix) : null,
            duree: offre.duree || '',
            mode_seance: offre.mode_seance || null,
            max_participants: offre.max_participants ? parseInt(offre.max_participants, 10) : 1,
            ordre: i,
          })
        }
      }

      ajoutees.push(pratique.nom || pratique.slug)
      if (modePratique) modesAjoutes.push(...modePratique.split(', '))
    }

    // Tout était déjà présent : rien à annoncer
    if (ajoutees.length === 0) {
      return json({ success: true, added: 0 }, 200)
    }

    // ---- Format global du praticien enrichi des nouveaux modes ----
    const anciens = praticien.mode_exercice
      ? String(praticien.mode_exercice).split(', ').filter(Boolean)
      : []
    const fusionnes = [...new Set([...anciens, ...modesAjoutes])]
    await supabase
      .from('praticiens')
      .update({ mode_exercice: fusionnes.join(', ') })
      .eq('id', praticien.id)

    // ---- Mails d'ajout (pas d'onboarding, le praticien est déjà actif) ----
    await sendAddPracticeEmails(praticien, ajoutees, lang === 'en' ? 'en' : 'fr')

    return json({ success: true, added: ajoutees.length }, 200)

  } catch (err) {
    return json({ error: 'SERVER_ERROR', details: String(err) }, 500)
  }
})

async function sendAddPracticeEmails(
  praticien: { prenom: string; nom: string; email: string },
  ajoutees: string[],
  lang: 'fr' | 'en'
) {
  const liste = ajoutees.join(', ')

  const wrap = (title: string, bodyHtml: string, cta: { href: string; label: string }) => `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
      <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>
      <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">${title}</h1>
      ${bodyHtml}
      <a href="${cta.href}"
        style="display:inline-block;padding:14px 32px;background:#3e295d;color:#fff;text-decoration:none;font-family:Jost,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
        ${cta.label}
      </a>
      <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 40px 0 24px;" />
      <div style="text-align: center;">
        <img src="https://theidalafamily.com/newlogo.png" alt="The Idala Family" style="width: 80px; height: auto; margin-bottom: 12px;" />
        <p style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
          <a href="https://theidalafamily.com" style="color: #9B6EBF; text-decoration: none;">theidalafamily.com</a>
        </p>
      </div>
    </div>`

  const send = (to: string, subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'The Idala Family <contact@theidalafamily.com>', to, subject, html }),
    })

  // ---- Praticien ----
  const praticienHtml = lang === 'en'
    ? wrap(
        `Your profile is updated, ${praticien.prenom}`,
        `<p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
           The practice you just added (${liste}) is now live on your Idala profile.
         </p>
         <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
           It is open for bookings right away. Your clients can already reserve it.
         </p>`,
        { href: 'https://theidalafamily.com', label: 'View my profile' }
      )
    : wrap(
        `Votre profil est à jour, ${praticien.prenom}`,
        `<p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
           La pratique que vous venez d'ajouter (${liste}) est désormais en ligne sur votre profil Idala.
         </p>
         <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
           Elle est ouverte à la réservation dès maintenant. Vos clients peuvent déjà la réserver.
         </p>`,
        { href: 'https://theidalafamily.com', label: 'Voir mon profil' }
      )

  await send(
    praticien.email,
    lang === 'en'
      ? 'Your new practice is live | The Idala Family'
      : 'Votre nouvelle pratique est en ligne | The Idala Family',
    praticienHtml
  )

  // ---- Idala (interne, toujours en français) ----
  const idalaHtml = wrap(
    'Nouvelle pratique ajoutée',
    `<p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
       ${praticien.prenom} ${praticien.nom} vient d'ajouter à son profil : ${liste}.
     </p>
     <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
       Cette pratique est déjà en ligne et réservable. Pour ajuster un contenu, rendez-vous dans l'administration.
     </p>`,
    { href: 'https://theidalafamily.com/#/admin/praticiens', label: 'Voir dans l\'admin' }
  )

  await send(
    'contact@theidalafamily.com',
    `${praticien.prenom} ${praticien.nom} a ajouté une pratique`,
    idalaHtml
  )
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}