import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`} onClick={onClose}>
      <span className="toast__icon">{type === 'success' ? '✓' : '✕'}</span>
      <span className="toast__message">{message}</span>
    </div>
  )
}