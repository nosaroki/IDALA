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

// Déduit le format (mode d'exercice) à partir des modes des offres.
// Le format n'est plus saisi à la main : il découle des offres, seule source de vérité.
function modesFromOffres(offres: any[]): string {
  return [...new Set((offres || []).map((o: any) => o.mode_seance).filter(Boolean))].join(', ')
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

  // Adresse cabinet transmise par la candidature (mirror candidatures -> praticiens)
  const cabinetFields = {
    cabinet_adresse:     cand.cabinet_adresse     || null,
    cabinet_code_postal: cand.cabinet_code_postal || null,
    cabinet_ville:       cand.cabinet_ville       || null,
    cabinet_digicode:    cand.cabinet_digicode    || null,
    cabinet_interphone:  cand.cabinet_interphone  || null,
    cabinet_etage:       cand.cabinet_etage        || null,
    cabinet_complement:  cand.cabinet_complement  || null,
  }
  const hasCabinet = !!cand.cabinet_adresse

  const isFr = cand.langue_interface !== 'en'
  const token = crypto.randomUUID()

  // 🔥Normalisation email
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

  // Format global du praticien : union des modes de toutes les offres de la candidature.
  const candidatureModes = [...new Set(
    Object.values(pratiquesDetails).flatMap((d: any) => (d?.offres || []).map((o: any) => o.mode_seance).filter(Boolean))
  )] as string[]

  const { data: pratiquesData } = await supabase
    .from('pratiques')
    .select('id, slug')
    .in('slug', practiqueSlugs)

  // =========================================================
  // COPIE DES PHOTOS : candidatures/{uuid}/ -> praticiens/{slug}/
  // =========================================================
  const BUCKET = 'photos-praticiens'

  // Genere le slug du praticien (meme logique que plus bas pour les nouveaux)
  // Pour un praticien existant, on utilisera son slug actuel un peu plus bas
  let praticienSlug = ''

  // Photo principale et galerie
  const galleryUrls = cand.photos_urls || []
  if (cand.main_photo && !galleryUrls.includes(cand.main_photo)) {
    galleryUrls.unshift(cand.main_photo)
  }

  // Photos par pratique (depuis pratiques_details)
  const photosPratiques: { [slug: string]: string } = {}
  for (const pSlug of Object.keys(pratiquesDetails)) {
    const photoUrl = pratiquesDetails[pSlug]?.photo_url
    if (photoUrl) {
      photosPratiques[pSlug] = photoUrl
    }
  }

  // Fonction qui extrait le chemin Storage depuis une URL Supabase
  function urlToStoragePath(url: string): string | null {
    const marker = `/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length).split('?')[0]
  }

  // Fonction qui copie une photo vers praticiens/{slug}/ et renvoie la nouvelle URL
  async function copyPhotoToPraticien(oldUrl: string, praticienSlugLocal: string): Promise<string> {
    const oldPath = urlToStoragePath(oldUrl)
    if (!oldPath) return oldUrl // pas une URL Supabase, on laisse tel quel

    // Nom du fichier (dernier segment du chemin)
    const filename = oldPath.split('/').pop() || `photo-${Date.now()}.jpg`
    const newPath = `praticiens/${praticienSlugLocal}/${filename}`

    // Copie via l'API Storage de Supabase
    const { error: copyError } = await supabase.storage
      .from(BUCKET)
      .copy(oldPath, newPath)

    if (copyError) {
      // Si le fichier existe deja a destination, c'est un succes (copie deja faite)
      if (copyError.message?.includes('already exists')) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
        return urlData.publicUrl
      }
      console.error(`Erreur copie ${oldPath} -> ${newPath}:`, copyError.message)
      return oldUrl // autre type d'erreur : on garde l'ancienne URL
    }

    // Construit la nouvelle URL publique
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath)
    return urlData.publicUrl
  }

  // =========================================================
  // 🔥DETECTION PRATICIEN EXISTANT 
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
    praticienSlug = existingPraticien.slug
    if (hasCabinet && !existingPraticien.cabinet_adresse) {
      await supabase.from('praticiens').update(cabinetFields).eq('id', existingPraticien.id)
    }
    console.log('✔ Praticien existant détecté:', existingPraticien.id)

  } else {
      // CAS 2 : création nouveau praticien
      praticienSlug = generateSlug(prenom, nom)

      // Copie de la photo principale et de la galerie vers praticiens/{slug}/
      let newPhotoUrl = photo_url
      const newPhotosUrls: string[] = []

      if (photo_url) {
        newPhotoUrl = await copyPhotoToPraticien(photo_url, praticienSlug)
      }
      for (const oldUrl of (cand.photos_urls || [])) {
        const newUrl = await copyPhotoToPraticien(oldUrl, praticienSlug)
        newPhotosUrls.push(newUrl)
      }

      const { data: created, error: insertError } = await supabase
        .from('praticiens')
        .insert({
          prenom,
          nom,
          email: normalizedEmail,
          telephone: cand.telephone,
          siret: cand.siret || '',
          ville: cand.ville,
          pays: cand.pays,
          langues: cand.langues,
          mode_exercice: candidatureModes.join(', '),
          bio_fr,
          bio_complete_fr,
          bio_en,
          bio_complete_en,
          photo_url: newPhotoUrl,
          photos_urls: newPhotosUrls,
          slug: praticienSlug,
          onboarding_token: token,
          actif: false,
          ...cabinetFields,
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
  // 🔥AJOUT PRATIQUES (ANTI DOUBLON)
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

      // Copie de la photo de cette pratique vers praticiens/{slug}/
      let pratiquePhotoUrl = null
      if (photosPratiques[pratique.slug]) {
        pratiquePhotoUrl = await copyPhotoToPraticien(
          photosPratiques[pratique.slug],
          praticienSlug
        )
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
          mode_exercice: modesFromOffres(details.offres),
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
    }
  }

  // =========================================================
  // MAJ format global du praticien EXISTANT
  // Un praticien existant qui ajoute une pratique voit son format global enrichi
  // des nouveaux modes, au lieu de rester figé sur son ancienne valeur.
  // =========================================================
  if (isExistingPraticien && newPraticien && candidatureModes.length > 0) {
    const anciens = existingPraticien.mode_exercice
      ? String(existingPraticien.mode_exercice).split(', ').filter(Boolean)
      : []
    const fusionnes = [...new Set([...anciens, ...candidatureModes])]
    await supabase
      .from('praticiens')
      .update({ mode_exercice: fusionnes.join(', ') })
      .eq('id', newPraticien.id)
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
        : 'Bienvenue dans The Idala Family | Finalisez votre profil',

     html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>

          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">
            ${isExistingPraticien ? `Bonjour ${prenom},` : `Bienvenue ${prenom},`}
          </h1>

          ${isExistingPraticien
            ? `
              <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
                Votre nouvelle pratique a bien été ajoutée à votre profil Idala.
              </p>
              <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
                Elle est désormais visible sur votre fiche et peut accueillir de nouvelles réservations.
              </p>
            `
            : `
              <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
                Nous avons le plaisir de vous accueillir au sein de The Idala Family. Votre profil a été validé par notre équipe.
              </p>
              <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
                Pour finaliser votre inscription et commencer à recevoir des réservations, veuillez compléter votre profil en cliquant sur le lien ci-dessous.
              </p>
            `
          }

          <a href="${isExistingPraticien ? 'https://theidalafamily.com' : `https://theidalafamily.com/#/onboarding/${token}`}"
            style="display:inline-block;padding:14px 32px;background:#3e295d;color:#fff;text-decoration:none;font-family:Jost,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border-radius:1em;">
            ${isExistingPraticien ? 'Voir mon profil' : 'Compléter mon profil'}
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
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true, token }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
