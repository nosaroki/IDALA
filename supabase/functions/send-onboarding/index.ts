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
  const slug = generateSlug(prenom, nom)

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

  const { data: newPraticien, error: insertError } = await supabase
    .from('praticiens')
    .insert({
      prenom,
      nom,
      email: cand.email,
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
      slug,
      onboarding_token: token,
      actif: false,
    })
    .select()
    .single()

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: corsHeaders
    })
  }

  if (pratiquesData && newPraticien) {
    for (const pratique of pratiquesData) {
      const details = pratiquesDetails[pratique.slug] || {}
      const { data: newPP } = await supabase.from('praticien_pratiques').insert({
        praticien_id: newPraticien.id,
        pratique_id: pratique.id,
        bio_fr: details.bio_fr || '',
        bio_en: details.bio_en || '',
      }).select().single()

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

  await supabase
    .from('candidatures')
    .update({ onboarding_sent: true })
    .eq('id', candidature_id)

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: email,
      subject: isFr
        ? 'Bienvenue dans The Idala Family — Finalisez votre profil'
        : 'Welcome to The Idala Family — Complete your profile',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">
            ${isFr ? `Bienvenue ${prenom},` : `Welcome ${prenom},`}
          </h1>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
            ${isFr
              ? 'Nous avons le plaisir de vous accueillir au sein de The Idala Family. Votre profil a été validé par notre équipe.'
              : 'We are delighted to welcome you to The Idala Family. Your profile has been validated by our team.'}
          </p>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
            ${isFr
              ? 'Pour finaliser votre inscription et commencer à recevoir des réservations, veuillez compléter votre profil en cliquant sur le lien ci-dessous.'
              : 'To complete your registration and start receiving bookings, please complete your profile by clicking the link below.'}
          </p>
          <a href="https://theidalafamily.com/#/onboarding/${token}"
            style="display: inline-block; padding: 14px 32px; background: #3e295d; color: white; text-decoration: none; font-family: Jost, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border-radius: 8px;">
            ${isFr ? 'Compléter mon profil' : 'Complete my profile'}
          </a>
          <p style="font-size: 13px; line-height: 1.8; font-weight: 300; color: #9B6EBF; margin-top: 32px;">
            ${isFr
              ? 'Ce lien est personnel et sécurisé. Ne le partagez pas.'
              : 'This link is personal and secure. Do not share it.'}
          </p>
          <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 32px 0;" />
          <p style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase;">theidalafamily.com</p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true, token }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})