import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function firstSentence(text: string): string {
  if (!text) return ''
  const match = text.match(/^.*?[.!?]/)
  return match ? match[0].trim() : text.trim()
}

function restOfText(text: string): string {
  if (!text) return ''
  const match = text.match(/^.*?[.!?]\s*(.*)$/s)
  return match && match[1] ? match[1].trim() : ''
}

function generateSlug(prenom: string, nom: string): string {
  const nomClean = nom ? nom.slice(0, 3) : ''
  return `${prenom}-${nomClean}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { candidature_id, prenom, nom, email } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  )

  // 🔎 Récupération candidature
  const { data: cand, error: candError } = await supabase
    .from('candidatures')
    .select('*')
    .eq('id', candidature_id)
    .single()

  if (candError || !cand) {
    return new Response(JSON.stringify({ error: 'Candidature introuvable' }), {
      status: 404,
      headers: corsHeaders
    })
  }

  const isFr = cand.langue_interface !== 'en'
  const token = crypto.randomUUID()

  // 🔥 MODIF IMPORTANTE : normalisation email
  const normalizedEmail = cand.email?.trim().toLowerCase()

  const bio_fr = firstSentence(cand.bio_fr || cand.motivation || '')
  const bio_complete_fr = restOfText(cand.bio_fr || cand.motivation || '')
  const bio_en = firstSentence(cand.bio_en || '')
  const bio_complete_en = restOfText(cand.bio_en || '')

  const photo_url = cand.main_photo || cand.photos_urls?.[0] || null

  const pratiquesDetails = cand.pratiques_details || {}
  const practiqueSlugs = Object.keys(pratiquesDetails).length > 0
    ? Object.keys(pratiquesDetails)
    : [cand.pratique?.split(',')[0]?.trim() || ''].filter(Boolean)

  const { data: pratiquesData } = await supabase
    .from('pratiques')
    .select('id, slug')
    .in('slug', practiqueSlugs)

  // =========================================================
  // 🔥 MODIF 1 : DETECTION PRATICIEN EXISTANT
  // =========================================================
  const { data: existingPraticien } = await supabase
    .from('praticiens')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle()

  let newPraticien
  let isExistingPraticien = false

  if (existingPraticien) {
    // CAS 1 : praticien déjà existant
    newPraticien = existingPraticien
    isExistingPraticien = true
    console.log('✔ Praticien existant détecté:', existingPraticien.id)

  } else {
    // CAS 2 : création nouveau praticien
    const slug = generateSlug(prenom, nom)

    const { data: created, error: insertError } = await supabase
      .from('praticiens')
      .insert({
        prenom,
        nom,
        email: normalizedEmail,
        telephone: cand.telephone,
        ville: cand.ville,
        pays: cand.pays,
        langues: cand.langues,
        mode_exercice: cand.mode_exercice,
        bio_fr,
        bio_complete_fr,
        bio_en,
        bio_complete_en,
        photo_url,
        photos_urls: cand.photos_urls || [],
        slug,
        onboarding_token: token,
        actif: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('INSERT ERROR:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: corsHeaders
      })
    }

    newPraticien = created
  }

  // =========================================================
  // 🔥 MODIF 2 : AJOUT PRATIQUES (ANTI DOUBLON)
  // =========================================================
  if (pratiquesData && newPraticien) {
    for (const pratique of pratiquesData) {
      const details = pratiquesDetails[pratique.slug] || {}

      // 🔥 check existence pratique
      const { data: existingPP } = await supabase
        .from('praticien_pratiques')
        .select('id')
        .eq('praticien_id', newPraticien.id)
        .eq('pratique_id', pratique.id)
        .maybeSingle()

      if (existingPP) {
        console.log(`Pratique déjà existante: ${pratique.slug}`)
        continue
      }

      const { data: newPP } = await supabase
        .from('praticien_pratiques')
        .insert({
          praticien_id: newPraticien.id,
          pratique_id: pratique.id,
          bio_fr: details.bio_fr || '',
          bio_en: details.bio_en || '',
          public_cible: details.public_cible || '',
          type_seance: details.type_seance || '',
          mode_exercice: details.mode_exercice || '',
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
            ordre: i,
          })
        }
      }
    }
  }

  // =========================================================
  // UPDATE candidature
  // =========================================================
  await supabase
    .from('candidatures')
    .update({ onboarding_sent: true })
    .eq('id', candidature_id)

  // =========================================================
  // EMAIL (MODIF logique selon existant / nouveau)
  // =========================================================
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: normalizedEmail,
      subject: isExistingPraticien
        ? 'Votre nouvelle pratique a été ajoutée à votre profil Idala'
        : 'Bienvenue dans The Idala Family — Finalisez votre profil',

      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF;">The Idala Family</p>

          <h1 style="font-size: 28px; font-weight: 400;">
            ${isExistingPraticien ? `Bonjour ${prenom}` : `Bienvenue ${prenom}`}
          </h1>

          <p style="font-size: 15px; line-height: 1.8;">
            ${
              isExistingPraticien
                ? "Votre nouvelle pratique a été ajoutée à votre profil."
                : "Votre profil a été validé par notre équipe."
            }
          </p>

          <a href="${isExistingPraticien ? 'https://theidalafamily.com' : `https://theidalafamily.com/#/onboarding/${token}`}"
            style="display:inline-block;padding:14px 32px;background:#3e295d;color:#fff;text-decoration:none;border-radius:8px;font-family:Jost,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
            ${
              isExistingPraticien
                ? "Voir le site"
                : "Compléter mon profil"
            }
          </a>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true, token }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})