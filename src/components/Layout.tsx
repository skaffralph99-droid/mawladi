import { supabase } from '../lib/supabase'
import { LogOut } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mw-bg flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full">{children}</div>
      <button onClick={() => supabase.auth.signOut()}
        className="fixed bottom-4 left-4 w-10 h-10 rounded-full bg-mw-card border border-mw-border flex items-center justify-center text-mw-dim hover:text-mw-red transition-all z-50">
        <LogOut size={16} />
      </button>
    </div>
  )
}
