import { useState } from 'react'

export default function IbanField({ iban, onChange }) {
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const maskIban = (value) => {
    if (!value) return ''
    const clean = value.replace(/\s/g, '')
    if (clean.length < 8) return value
    const start = clean.slice(0, 4)
    const end = clean.slice(-4)
    const middle = '•'.repeat(Math.max(0, clean.length - 8))
    return `${start} ${middle.match(/.{1,4}/g)?.join(' ') || ''} ${end}`
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(iban)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  // Mode édition : input modifiable
  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <input
          value={iban || ''}
          placeholder="FR76..."
          onChange={e => onChange(e.target.value)}
          style={{
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
            flex: 1,
            minWidth: '240px',
          }}
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{
            fontSize: '10px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '4px 10px',
            background: '#3DCC7022',
            border: '1px solid #3DCC7044',
            borderRadius: '4px',
            color: '#1a8844',
            cursor: 'pointer',
          }}
        >
          ✓ Valider
        </button>
      </div>
    )
  }

  // Pas d'IBAN renseigné
  if (!iban) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#999', fontStyle: 'italic', fontSize: '13px' }}>
          Aucun IBAN renseigné
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            fontSize: '10px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid #C5B8F0',
            borderRadius: '4px',
            color: '#9B6EBF',
            cursor: 'pointer',
          }}
        >
          + Ajouter
        </button>
      </div>
    )
  }

  // Mode lecture : masqué avec 3 boutons
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        letterSpacing: '0.5px',
        background: '#F0EAFA',
        padding: '4px 10px',
        borderRadius: '4px',
        color: '#3e295d',
      }}>
        {revealed ? iban : maskIban(iban)}
      </span>
      <button
        type="button"
        onClick={() => setRevealed(r => !r)}
        style={{
          fontSize: '10px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          padding: '4px 10px',
          background: 'transparent',
          border: '1px solid #C5B8F0',
          borderRadius: '4px',
          color: '#9B6EBF',
          cursor: 'pointer',
        }}
      >
        {revealed ? 'Masquer' : 'Afficher'}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          fontSize: '10px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          padding: '4px 10px',
          background: copied ? '#3DCC7022' : 'transparent',
          border: `1px solid ${copied ? '#3DCC70' : '#C5B8F0'}`,
          borderRadius: '4px',
          color: copied ? '#1a8844' : '#9B6EBF',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Copié' : 'Copier'}
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{
          fontSize: '10px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          padding: '4px 10px',
          background: 'transparent',
          border: '1px solid #C5B8F0',
          borderRadius: '4px',
          color: '#9B6EBF',
          cursor: 'pointer',
        }}
      >
        Modifier
      </button>
    </div>
  )
}