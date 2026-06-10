import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Building2, LogOut } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()
  const tabs = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/buildings', icon: Building2, label: 'المباني' },
  ]

  return (
    <div className="min-h-screen bg-mw-bg flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full pb-20">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 bg-mw-card/95 backdrop-blur-xl border-t border-mw-border/60 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {tabs.map(t => {
            const active = loc.pathname === t.path
            return (
              <button key={t.path} onClick={() => nav(t.path)} className={`flex flex-col items-center gap-0.5 py-1 px-4 transition-all ${active ? 'text-mw-amber' : 'text-mw-dim'}`}>
                <t.icon size={20} />
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            )
          })}
          <button onClick={() => supabase.auth.signOut()} className="flex flex-col items-center gap-0.5 py-1 px-4 text-mw-dim hover:text-mw-red transition-all">
            <LogOut size={20} />
            <span className="text-[10px] font-bold">خروج</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
