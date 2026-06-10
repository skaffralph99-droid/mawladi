import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Zap } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true); setError('')
    const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (e) {
      if (e.message.includes('Invalid login')) {
        const { error: e2 } = await supabase.auth.signUp({ email, password: pass })
        if (e2) setError(e2.message)
      } else setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-mw-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-up">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mw-amber to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mw-amber/20">
            <Zap size={40} className="text-mw-bg" />
          </div>
          <h1 className="text-gradient text-3xl font-black">Mawladi ⚡</h1>
          <p className="text-mw-dim text-sm mt-2">إدارة اشتراكات المولدات</p>
        </div>
        <div className="card space-y-4">
          <div><label className="label-m">البريد الإلكتروني</label><input value={email} onChange={e => setEmail(e.target.value)} className="input-m" type="email" placeholder="you@email.com" dir="ltr" /></div>
          <div><label className="label-m">كلمة المرور</label><input value={pass} onChange={e => setPass(e.target.value)} className="input-m" type="password" placeholder="••••••" dir="ltr" /></div>
          {error && <p className="text-mw-red text-sm font-semibold">{error}</p>}
          <button onClick={submit} disabled={loading || !email || !pass} className="btn-amber">{loading ? 'جاري...' : 'تسجيل الدخول'}</button>
        </div>
      </div>
    </div>
  )
}
