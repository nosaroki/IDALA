import { useState, useEffect, useContext, useMemo } from 'react'
import { LangCtx } from '../components/LangContext'
import { supabase } from '../lib/supabaseClient'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Regroupe les créneaux par jour (clé = YYYY-MM-DD)
function groupByDay(slots) {
  const map = {}
  for (const s of slots) {
    const dayKey = s.start.slice(0, 10)
    if (!map[dayKey]) map[dayKey] = []
    map[dayKey].push(s)
  }
  return map
}

export default function BookingCalendar({ praticienId, scheduleId, lengthMinutes, onSelectSlot, selectedSlot }) {
  const { lang } = useContext(LangCtx)

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11

  const [slotsByDay, setSlotsByDay] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(null)

  const months = lang === 'fr' ? MONTHS_FR : MONTHS_EN
  const dayLabels = lang === 'fr' ? DAYS_FR : DAYS_EN

  // Plafond : 3 mois glissants
  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setMonth(d.getMonth() + 3)
    return d
  }, [today])

  // Peut-on aller au mois précédent / suivant ?
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())
  const canGoNext = viewYear < maxDate.getFullYear() || (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth())

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setActiveDay(null)

      const from = new Date(viewYear, viewMonth, 1, 0, 0, 0)
      const to = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59)

      // On ne demande pas de créneaux dans le passé
      const now = new Date()
      const effectiveFrom = from < now ? now : from

      try {
        const res = await fetch(`${SUPABASE_FN}/functions/v1/get-availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(scheduleId ? { schedule_id: scheduleId } : { praticien_id: praticienId }),
            from: effectiveFrom.toISOString(),
            to: to.toISOString(),
            length_minutes: lengthMinutes,
          }),
        })
        const data = await res.json()
        console.log('SLOTS BRUTS SUPERSAAS:', data.slots?.slice(0, 2))
        
        if (cancelled) return
        if (data.slots) {
          setSlotsByDay(groupByDay(data.slots))
        } else {
          setSlotsByDay({})
        }
      } catch (e) {
        if (!cancelled) setError(
          lang === 'fr'
            ? 'Impossible de charger les disponibilités. Réessayez.'
            : 'Could not load availability. Please try again.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (praticienId || scheduleId) load()
    return () => { cancelled = true }
  }, [praticienId, scheduleId, lengthMinutes, viewYear, viewMonth, lang])

  // Construction de la grille du mois
  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    // getDay: 0=dim..6=sam. On veut lundi en premier.
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d))
    }
    return cells
  }, [viewYear, viewMonth])

  function dayKey(date) {
    const p = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
  }

  function prevMonth() {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (!canGoNext) return
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const now = new Date()
  const activeSlots = activeDay ? (slotsByDay[activeDay] || []) : []

  return (
    <div className="resa-calendar">
      {/* En-tête navigation mois */}
      <div className="resa-cal-head">
        <button
          type="button"
          className="resa-cal-nav"
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label={lang === 'fr' ? 'Mois précédent' : 'Previous month'}
        >‹</button>
        <span className="resa-cal-month">{months[viewMonth]} {viewYear}</span>
        <button
          type="button"
          className="resa-cal-nav"
          onClick={nextMonth}
          disabled={!canGoNext}
          aria-label={lang === 'fr' ? 'Mois suivant' : 'Next month'}
        >›</button>
      </div>

      {/* Jours de la semaine */}
      <div className="resa-cal-weekdays">
        {dayLabels.map(d => <span key={d}>{d}</span>)}
      </div>

      {/* Grille des jours */}
      {loading ? (
        <p className="resa-cal-loading">
          {lang === 'fr' ? 'Chargement des disponibilités...' : 'Loading availability...'}
        </p>
      ) : error ? (
        <p className="resa-error">{error}</p>
      ) : (
        <div className="resa-cal-grid">
          {grid.map((date, i) => {
            if (!date) return <span key={`empty-${i}`} className="resa-cal-cell resa-cal-cell--empty" />
            const key = dayKey(date)
            const hasSlots = (slotsByDay[key] || []).length > 0
            const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const isActive = activeDay === key
            return (
              <button
                key={key}
                type="button"
                className={`resa-cal-cell ${hasSlots ? 'resa-cal-cell--available' : ''} ${isActive ? 'resa-cal-cell--active' : ''}`}
                disabled={!hasSlots || isPast}
                onClick={() => setActiveDay(key)}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      )}

      {/* Créneaux du jour sélectionné */}
      {activeDay && activeSlots.length > 0 && (
        <div className="resa-slots">
          <p className="resa-slots__label">
            {lang === 'fr' ? 'Créneaux disponibles' : 'Available times'}
          </p>
          <div className="resa-slots__grid">
            {activeSlots.map(slot => {
              const time = slot.start.slice(11, 16)
              const isSelected = selectedSlot?.start === slot.start
              return (
                <button
                  key={slot.start}
                  type="button"
                  className={`resa-slot ${isSelected ? 'resa-slot--selected' : ''}`}
                  onClick={() => onSelectSlot(slot)}
                >
                  {time}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// import { useState, useEffect, useContext, useMemo } from 'react'
// import { LangCtx } from './LangContext'
// import { supabase } from '../lib/supabaseClient'

// const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
// const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
// const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
// const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// // Regroupe les créneaux par jour (clé = YYYY-MM-DD)
// function groupByDay(slots) {
//   const map = {}
//   for (const s of slots) {
//     const dayKey = s.start.slice(0, 10)
//     if (!map[dayKey]) map[dayKey] = []
//     map[dayKey].push(s)
//   }
//   return map
// }

// export default function BookingCalendar({ praticienId, lengthMinutes, onSelectSlot, selectedSlot }) {
//   const { lang } = useContext(LangCtx)

//   const today = useMemo(() => new Date(), [])
//   const [viewYear, setViewYear] = useState(today.getFullYear())
//   const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11

//   const [slotsByDay, setSlotsByDay] = useState({})
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [activeDay, setActiveDay] = useState(null)

//   const months = lang === 'fr' ? MONTHS_FR : MONTHS_EN
//   const dayLabels = lang === 'fr' ? DAYS_FR : DAYS_EN

//   // Plafond : 3 mois glissants
//   const maxDate = useMemo(() => {
//     const d = new Date(today)
//     d.setMonth(d.getMonth() + 3)
//     return d
//   }, [today])

//   // Peut-on aller au mois précédent / suivant ?
//   const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())
//   const canGoNext = viewYear < maxDate.getFullYear() || (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth())

//   useEffect(() => {
//     let cancelled = false
//     async function load() {
//       setLoading(true)
//       setError(null)
//       setActiveDay(null)

//       const from = new Date(viewYear, viewMonth, 1, 0, 0, 0)
//       const to = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59)

//       // On ne demande pas de créneaux dans le passé
//       const now = new Date()
//       const effectiveFrom = from < now ? now : from

//       try {
//         const res = await fetch(`${SUPABASE_FN}/functions/v1/get-availability`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${SUPABASE_ANON}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             praticien_id: praticienId,
//             from: effectiveFrom.toISOString(),
//             to: to.toISOString(),
//             length_minutes: lengthMinutes,
//           }),
//         })
//         const data = await res.json()
//         if (cancelled) return
//         if (data.slots) {
//           setSlotsByDay(groupByDay(data.slots))
//         } else {
//           setSlotsByDay({})
//         }
//       } catch (e) {
//         if (!cancelled) setError(
//           lang === 'fr'
//             ? 'Impossible de charger les disponibilités. Réessayez.'
//             : 'Could not load availability. Please try again.'
//         )
//       } finally {
//         if (!cancelled) setLoading(false)
//       }
//     }
//     if (praticienId) load()
//     return () => { cancelled = true }
//   }, [praticienId, lengthMinutes, viewYear, viewMonth, lang])

//   // Construction de la grille du mois
//   const grid = useMemo(() => {
//     const firstDay = new Date(viewYear, viewMonth, 1)
//     // getDay: 0=dim..6=sam. On veut lundi en premier.
//     let startOffset = firstDay.getDay() - 1
//     if (startOffset < 0) startOffset = 6
//     const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

//     const cells = []
//     for (let i = 0; i < startOffset; i++) cells.push(null)
//     for (let d = 1; d <= daysInMonth; d++) {
//       cells.push(new Date(viewYear, viewMonth, d))
//     }
//     return cells
//   }, [viewYear, viewMonth])

//   function dayKey(date) {
//     const p = (n) => String(n).padStart(2, '0')
//     return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
//   }

//   function prevMonth() {
//     if (!canGoPrev) return
//     if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
//     else setViewMonth(viewMonth - 1)
//   }
//   function nextMonth() {
//     if (!canGoNext) return
//     if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
//     else setViewMonth(viewMonth + 1)
//   }

//   const now = new Date()
//   const activeSlots = activeDay ? (slotsByDay[activeDay] || []) : []

//   return (
//     <div className="resa-calendar">
//       {/* En-tête navigation mois */}
//       <div className="resa-cal-head">
//         <button
//           type="button"
//           className="resa-cal-nav"
//           onClick={prevMonth}
//           disabled={!canGoPrev}
//           aria-label={lang === 'fr' ? 'Mois précédent' : 'Previous month'}
//         >‹</button>
//         <span className="resa-cal-month">{months[viewMonth]} {viewYear}</span>
//         <button
//           type="button"
//           className="resa-cal-nav"
//           onClick={nextMonth}
//           disabled={!canGoNext}
//           aria-label={lang === 'fr' ? 'Mois suivant' : 'Next month'}
//         >›</button>
//       </div>

//       {/* Jours de la semaine */}
//       <div className="resa-cal-weekdays">
//         {dayLabels.map(d => <span key={d}>{d}</span>)}
//       </div>

//       {/* Grille des jours */}
//       {loading ? (
//         <p className="resa-cal-loading">
//           {lang === 'fr' ? 'Chargement des disponibilités...' : 'Loading availability...'}
//         </p>
//       ) : error ? (
//         <p className="resa-error">{error}</p>
//       ) : (
//         <div className="resa-cal-grid">
//           {grid.map((date, i) => {
//             if (!date) return <span key={`empty-${i}`} className="resa-cal-cell resa-cal-cell--empty" />
//             const key = dayKey(date)
//             const hasSlots = (slotsByDay[key] || []).length > 0
//             const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())
//             const isActive = activeDay === key
//             return (
//               <button
//                 key={key}
//                 type="button"
//                 className={`resa-cal-cell ${hasSlots ? 'resa-cal-cell--available' : ''} ${isActive ? 'resa-cal-cell--active' : ''}`}
//                 disabled={!hasSlots || isPast}
//                 onClick={() => setActiveDay(key)}
//               >
//                 {date.getDate()}
//               </button>
//             )
//           })}
//         </div>
//       )}

//       {/* Créneaux du jour sélectionné */}
//       {activeDay && activeSlots.length > 0 && (
//         <div className="resa-slots">
//           <p className="resa-slots__label">
//             {lang === 'fr' ? 'Créneaux disponibles' : 'Available times'}
//           </p>
//           <div className="resa-slots__grid">
//             {activeSlots.map(slot => {
//               const time = slot.start.slice(11, 16)
//               const isSelected = selectedSlot?.start === slot.start
//               return (
//                 <button
//                   key={slot.start}
//                   type="button"
//                   className={`resa-slot ${isSelected ? 'resa-slot--selected' : ''}`}
//                   onClick={() => onSelectSlot(slot)}
//                 >
//                   {time}
//                 </button>
//               )
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }