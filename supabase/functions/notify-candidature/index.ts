import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { record } = await req.json()

  const candidat = record

  // Email au candidat
  const emailCandidat = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Idala Family <contact@theidalafamily.com>',
      to: candidat.email,
      subject: 'We received your application — The Idala Family',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">The Idala Family</p>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 24px; line-height: 1.3;">Dear ${candidat.prenom},</h1>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
            Thank you for your interest in joining The Idala Family. We have received your application and will review it carefully.
          </p>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 16px;">
            We will get back to you as soon as possible.
          </p>
          <p style="font-size: 15px; line-height: 1.8; font-weight: 300; margin-bottom: 40px;">
            With care,<br/>The Idala Family
          </p>
          <hr style="border: none; border-top: 1px solid #E4D8F5; margin-bottom: 24px;" />
          <p style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase;">theidalafamily.com</p>
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
      subject: `Nouvelle candidature — ${candidat.prenom} ${candidat.nom}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #281745;">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9B6EBF; margin-bottom: 24px;">Nouvelle candidature</p>
          <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 24px;">${candidat.prenom} ${candidat.nom}</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 300;">
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; width: 140px;">Email</td><td style="padding: 8px 0;">${candidat.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Téléphone</td><td style="padding: 8px 0;">${candidat.telephone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Localisation</td><td style="padding: 8px 0;">${candidat.ville || '—'}, ${candidat.pays || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Spécialités</td><td style="padding: 8px 0;">${candidat.pratique || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Expérience</td><td style="padding: 8px 0;">${candidat.experience || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Prix</td><td style="padding: 8px 0;">${candidat.prix ? candidat.prix + ' €' : '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Format</td><td style="padding: 8px 0;">${candidat.mode_exercice || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Instagram</td><td style="padding: 8px 0;">${candidat.instagram || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #9B6EBF; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Site web</td><td style="padding: 8px 0;">${candidat.site_web || '—'}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 24px 0;" />
          <p style="font-size: 13px; font-weight: 300; color: #9B6EBF; line-height: 1.8;">${candidat.motivation || ''}</p>
          <hr style="border: none; border-top: 1px solid #E4D8F5; margin: 24px 0;" />
          <a href="https://theidalafamily.com/#/admin/candidatures" style="font-size: 11px; color: #9B6EBF; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-bottom: 1px solid #9B6EBF; padding-bottom: 2px;">Voir la candidature dans l'admin →</a>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})