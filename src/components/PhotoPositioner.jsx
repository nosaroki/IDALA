import { useState, useRef, useEffect } from 'react'

  function parsePosition(value) {
    if (!value) return { x: 50, y: 50 }
    const parts = value.split(/\s+/)
    let x = 50, y = 50
    for (const p of parts) {
      if (p === 'left') x = 0
      else if (p === 'right') x = 100
      else if (p === 'top') y = 0
      else if (p === 'bottom') y = 100
      else if (p === 'center') { /* keep default */ }
      else if (p.includes('%')) {
        const val = parseFloat(p)
        if (parts.indexOf(p) === 0) x = val
        else y = val
      }
    }
    return { x, y }
  }

export default function PhotoPositioner({ src, position, onChange }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState(() => parsePosition(position))
  const [zoom, setZoom] = useState(1)
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  useEffect(() => {
    setPos(parsePosition(position))
  }, [position])

  function handleMouseDown(e) {
    e.preventDefault()
    setDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: pos.x,
      startY: pos.y,
    }
  }

  useEffect(() => {
    if (!dragging) return

    function handleMouseMove(e) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const deltaX = e.clientX - dragStart.current.x
      const deltaY = e.clientY - dragStart.current.y

    //   const newX = Math.min(100, Math.max(0, dragStart.current.startX - (deltaX / rect.width) * 100))
      const newX = Math.min(100, Math.max(0,dragStart.current.startX - (deltaX / rect.width) * 200))
      const newY = Math.min(100, Math.max(0, dragStart.current.startY - (deltaY / rect.height) * 100))

      setPos({ x: Math.round(newX), y: Math.round(newY) })
    }

    function handleMouseUp() {
      setDragging(false)
      onChange(`${pos.x}% ${pos.y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, pos])

  // Touch support
  function handleTouchStart(e) {
    const touch = e.touches[0]
    setDragging(true)
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      startX: pos.x,
      startY: pos.y,
    }
  }

  useEffect(() => {
    if (!dragging) return

    function handleTouchMove(e) {
      const touch = e.touches[0]
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const deltaX = touch.clientX - dragStart.current.x
      const deltaY = touch.clientY - dragStart.current.y

      const newX = Math.min(100, Math.max(0, dragStart.current.startX - (deltaX / rect.width) * 100))
      const newY = Math.min(100, Math.max(0, dragStart.current.startY - (deltaY / rect.height) * 100))

      setPos({ x: Math.round(newX), y: Math.round(newY) })
    }

    function handleTouchEnd() {
      setDragging(false)
      onChange(`${pos.x}% ${pos.y}%`)
    }

    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, pos])

  if (!src) return null

  return (
    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px' }}>
        Cadrage de la photo principale
      </label>
      <p style={{
        fontSize: '11px',
        color: '#9B6EBF',
        fontStyle: 'italic',
        marginBottom: '12px',
      }}>
        Glissez la photo pour ajuster le cadrage
      </p>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${dragging ? '#9B6EBF' : '#C5B8F0'}`,
            cursor: dragging ? 'grabbing' : 'grab',
            flexShrink: 0,
            transition: 'border-color 0.2s',
            position: 'relative',
          }}
        >
          <img
            src={src}
            alt="Aperçu cadrage"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${pos.x}% ${pos.y}%`,
              pointerEvents: 'none',
              userSelect: 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
            }}
          />
        </div>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#C5B8F0',
            marginTop: '6px',
            width: '140px'
            }}>
            {/* <span>← gauche</span>
            <span>droite →</span> */}
            </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '12px',
          color: '#6B5B7E',
        }}>
            <div style={{ fontSize: '11px', color: '#6B5B7E' }}>
            Ajuste le cadrage en glissant la photo
            </div>
            {/* Position : {pos.x}% {pos.y}% */}
          <button
            type="button"
            onClick={() => {
              setPos({ x: 50, y: 50 })
              onChange('50% 50%')
            }}
            style={{
              marginTop: '8px',
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
            Recentrer
          </button>
          <div style={{ marginTop: '8px' }}>
  <span style={{ fontSize: '10px', display: 'block' }}>
    Zoom
  </span>

  <input
    type="range"
    min="1"
    max="2"
    step="0.01"
    value={zoom}
    onChange={(e) => setZoom(parseFloat(e.target.value))}
    style={{ width: '100%' }}
  />
</div>
        </div>
      </div>
    </div>
  )
}