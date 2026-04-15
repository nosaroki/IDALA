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
  return `${prenom}-${nom}`
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

  // Récupérer toutes les données de la candidature
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

  const token = crypto.randomUUID()
  const slug = generateSlug(prenom, nom)

  // Récupérer la pratique_id depuis le slug de la première pratique
  const firstPracticeSlug = cand.pratique?.split(',')[0]?.trim()
  let pratique_id = null
  if (firstPracticeSlug) {
    const { data: pratique } = await supabase
      .from('pratiques')
      .select('id')
      .eq('slug', firstPracticeSlug)
      .single()
    if (pratique) pratique_id = pratique.id
  }

  // Découper les bios
  const bio_fr = firstSentence(cand.bio_fr || cand.motivation || '')
  const bio_complete_fr = restOfText(cand.bio_fr || cand.motivation || '')
  const bio_en = firstSentence(cand.bio_en || '')
  const bio_complete_en = restOfText(cand.bio_en || '')

  // Photo de profil = première photo uploadée
  const photo_url = cand.main_photo || cand.photos_urls?.[0] || null

  // Créer la fiche praticien
  const { error: insertError } = await supabase
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
      pratique_id,
      slug,
      onboarding_token: token,
      actif: false,
    })

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: corsHeaders
    })
  }

  // Marquer la candidature comme onboarding envoyé
  await supabase
    .from('candidatures')
    .update({ onboarding_sent: true })
    .eq('id', candidature_id)

  // Envoyer l'email au praticien
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: email,
      subject: 'Bienvenue dans The Idala Family — Finalisez votre profil',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">Bienvenue ${prenom},</h1>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
            Nous avons le plaisir de vous accueillir au sein de The Idala Family. Votre profil a été validé par notre équipe.
          </p>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
            Pour finaliser votre inscription et commencer à recevoir des réservations, veuillez compléter votre profil en cliquant sur le lien ci-dessous.
          </p>
          <a href="https://theidalafamily.com/#/onboarding/${token}"
            style="display: inline-block; padding: 14px 32px; background: #3e295d; color: white; text-decoration: none; font-family: Jost, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border-radius: 8px;">
            Compléter mon profil
          </a>
          <p style="font-size: 13px; line-height: 1.8; font-weight: 300; color: #9B6EBF; margin-top: 32px;">
            Ce lien est personnel et sécurisé. Ne le partagez pas.
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