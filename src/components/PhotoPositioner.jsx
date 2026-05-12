import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

export default function PhotoPositioner({ src, position, onChange }) {
  const [showModal, setShowModal] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  function handleSave() {
    if (!croppedAreaPixels) return
    
    // Convertir les pixels en pourcentages pour object-position
    const xPercent = (croppedAreaPixels.x / croppedAreaPixels.width) * 100
    const yPercent = (croppedAreaPixels.y / croppedAreaPixels.height) * 100
    
    onChange(`${Math.round(xPercent)}% ${Math.round(yPercent)}%`)
    setShowModal(false)
  }

  function parsePosition(value) {
    if (!value) return { x: 50, y: 50 }
    const parts = value.split(/\s+/)
    let x = 50, y = 50
    for (const p of parts) {
      if (p.includes('%')) {
        const val = parseFloat(p)
        if (parts.indexOf(p) === 0) x = val
        else y = val
      }
    }
    return { x, y }
  }

  const pos = parsePosition(position)

  if (!src) return null

  return (
    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
        Cadrage de la photo principale
      </label>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Aperçu */}
        <div style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #C5B8F0',
          flexShrink: 0,
        }}>
          <img
            src={src}
            alt="Aperçu"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: position || 'center center',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#3e295d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Ajuster le cadrage
        </button>
      </div>

      {/* Modal de crop */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '500px',
            height: '500px',
            background: '#222',
          }}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </div>

          <div style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            {/* Slider zoom */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'white',
            }}>
              <span style={{ fontSize: '13px' }}>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '200px' }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#9B6EBF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}