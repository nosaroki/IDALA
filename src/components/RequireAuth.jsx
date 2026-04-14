import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Navigate, Outlet } from 'react-router-dom'

export default function RequireAuth() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  if (session === undefined) return null // chargement

  return session ? <Outlet /> : <Navigate to="/admin/login" replace />
}