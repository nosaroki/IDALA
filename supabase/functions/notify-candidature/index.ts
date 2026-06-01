import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { record } = await req.json()

  const candidat = record

  // Email au candidat
const isFr = record.langue_interface !== 'en'

const emailCandidat = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'The Idala Family <contact@theidalafamily.com>',
    to: candidat.email,
    subject: isFr
      ? 'Candidature reçue | The Idala Family'
      : 'Application received | The Idala Family',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
        <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>
        <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">
          ${isFr ? `Cher(e) ${candidat.prenom},` : `Dear ${candidat.prenom},`}
        </h1>
        <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
          ${isFr ? 'Merci pour votre intérêt.' : 'Thank you for your interest.'}
        </p>
        <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 32px;">
          ${isFr
            ? 'Nous avons bien reçu votre candidature et reviendrons vers vous dans les meilleurs délais.'
            : 'We have received your application and will get back to you as soon as possible.'}
        </p>
        <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 0;">
          ${isFr ? 'Bien à vous,' : 'With care,'}<br/>The Idala Family
        </p>
        <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 40px 0 24px;" />
        <div style="text-align: center;">
          <img src="https://theidalafamily.com/newlogo.png" alt="The Idala Family" style="width: 80px; height: auto; margin-bottom: 12px;" />
          <p style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
            <a href="https://theidalafamily.com" style="color: #9B6EBF; text-decoration: none;">theidalafamily.com</a>
          </p>
        </div>
    `,
  }),
})

  // Email de notification à Idala
  const emailIdala = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: 'contact@theidalafamily.com',
      subject: `Nouvelle candidature | ${candidat.prenom} ${candidat.nom}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">Nouvelle candidature</p>
          <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 8px;">${candidat.prenom} ${candidat.nom}</h1>
          <p style="font-size: 12px; color: #9B6EBF; letter-spacing: 1px; margin-bottom: 32px;">${candidat.langue_interface === 'fr' ? 'Candidature en français' : 'Application in English'}</p>

          <!-- Coordonnées -->
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 12px;">Coordonnées</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 300; margin-bottom: 32px;">
            <tr><td style="padding: 6px 0; color: #6B5B7E; width: 140px;">Email</td><td style="padding: 6px 0;">${candidat.email}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">Téléphone</td><td style="padding: 6px 0;">${candidat.telephone || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">SIRET</td><td style="padding: 6px 0;">${candidat.siret || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">Localisation</td><td style="padding: 6px 0;">${[candidat.ville, candidat.pays].filter(Boolean).join(', ') || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">Langues parlées</td><td style="padding: 6px 0;">${candidat.langues || '—'}</td></tr>
          </table>

          <!-- Profil professionnel -->
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 12px;">Profil professionnel</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 300; margin-bottom: 24px;">
            <tr><td style="padding: 6px 0; color: #6B5B7E; width: 140px;">Expérience</td><td style="padding: 6px 0;">${candidat.experience || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E; vertical-align: top;">Certifications</td><td style="padding: 6px 0; line-height: 1.6;">${candidat.certifications || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">Instagram</td><td style="padding: 6px 0;">${candidat.instagram || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B5B7E;">Site web</td><td style="padding: 6px 0;">${candidat.site_web || '—'}</td></tr>
          </table>

          <!-- Bio générale -->
          ${(candidat.bio_fr || candidat.bio_en) ? `
            <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 12px;">Bio générale</p>
            ${candidat.bio_fr ? `<p style="font-size: 14px; font-weight: 300; line-height: 1.7; margin-bottom: 12px;"><span style="color: #6B5B7E; font-size: 11px; letter-spacing: 1px;">FR — </span>${candidat.bio_fr}</p>` : ''}
            ${candidat.bio_en ? `<p style="font-size: 14px; font-weight: 300; line-height: 1.7; margin-bottom: 24px;"><span style="color: #6B5B7E; font-size: 11px; letter-spacing: 1px;">EN — </span>${candidat.bio_en}</p>` : ''}
          ` : ''}

          <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 24px 0;" />

          <!-- Spécialités détaillées -->
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 16px;">Spécialités proposées</p>

          ${(() => {
            const details = candidat.pratiques_details || {}
            const slugs = Object.keys(details)
            if (slugs.length === 0) {
              return `<p style="font-size: 14px; color: #6B5B7E;">${candidat.pratique || '—'}</p>`
            }
            return slugs.map(slug => {
              const d = details[slug] || {}
              const offres = (d.offres || []).map((o, i) => `
                <div style="margin-top: 12px; padding-left: 12px; border-left: 2px solid #E4D8F5;">
                  <p style="font-size: 13px; font-weight: 400; margin-bottom: 4px;">${o.titre_fr || 'Sans titre'} ${o.titre_en && o.titre_en !== o.titre_fr ? `<span style="color: #9B6EBF; font-size: 11px;">(EN: ${o.titre_en})</span>` : ''}</p>
                  <p style="font-size: 12px; color: #6B5B7E; margin-bottom: 4px;">${o.duree ? o.duree + ' min' : ''}${o.duree && o.prix ? ' · ' : ''}${o.prix ? o.prix + ' €' : ''}</p>
                  ${o.description_fr ? `<p style="font-size: 13px; font-weight: 300; color: #6B5B7E; line-height: 1.6; margin: 4px 0;">${o.description_fr}</p>` : ''}
                </div>
              `).join('')

              return `
                <div style="background: #FAF7FE; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="font-size: 16px; font-weight: 400; margin: 0 0 12px; color: #3e295d;">${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')}</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-weight: 300;">
                    <tr><td style="padding: 4px 0; color: #6B5B7E; width: 120px;">Public cible</td><td style="padding: 4px 0;">${d.public_cible || '—'}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6B5B7E;">Type de séance</td><td style="padding: 4px 0;">${d.type_seance || '—'}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6B5B7E;">Format</td><td style="padding: 4px 0;">${d.mode_exercice || '—'}</td></tr>
                  </table>
                  ${offres ? `
                    <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9B6EBF; margin: 16px 0 4px;">Offres</p>
                    ${offres}
                  ` : ''}
                </div>
              `
            }).join('')
          })()}

          <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 24px 0;" />

          <a href="https://theidalafamily.com/#/admin/candidatures"
            style="display: inline-block; padding: 14px 32px; background: #3e295d; color: #fff; text-decoration: none; font-family: Jost, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border-radius: 1em;">
            Voir la candidature dans l'admin
          </a>

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

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})