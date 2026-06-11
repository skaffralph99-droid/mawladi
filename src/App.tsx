import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import BuildingDetail from './pages/BuildingDetail'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setReady(true); return }
      const { error } = await supabase.auth.signInWithPassword({ email: 'guest@mawladi.app', password: 'guest123456' })
      if (error) {
        await supabase.auth.signUp({ email: 'guest@mawladi.app', password: 'guest123456' })
        // Try login again after signup
        await supabase.auth.signInWithPassword({ email: 'guest@mawladi.app', password: 'guest123456' })
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return (
    <div className="min-h-screen bg-mw-bg flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">⚡</div>
      <p className="text-gradient text-xl font-black tracking-wider">Mawladi</p>
    </div>
  )

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-mw-bg max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buildings/:id" element={<BuildingDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
