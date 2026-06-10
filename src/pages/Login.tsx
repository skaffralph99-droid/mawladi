import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Zap } from 'lucide-react'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Convert phone to a fake email for Supabase auth (no SMS needed)
  const phoneToEmail = (p: string) => {
    const clean = p.replace(/\D/g, '')
    return `${clean}@mawladi.app`
  }

  const submit = async () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 8) { setError('أدخل رقم هاتف صحيح'); return }
    if (pass.length < 6) { setError('كلمة المرور يجب أن تكون ٦ أحرف على الأقل'); return }

    setLoading(true); setError('')
    const email = phoneToEmail(clean)

    // Try login first
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: pass })

    if (loginErr) {
      if (loginErr.message.includes('Invalid login')) {
        // First time — create account
        const { error: signupErr } = await supabase.auth.signUp({ email, password: pass })
        if (signupErr) setError(signupErr.message)
      } else {
        setError(loginErr.message === 'Invalid login credentials' ? 'رقم الهاتف أو كلمة المرور خطأ' : loginErr.message)
      }
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
          <div>
            <label className="label-m">رقم الهاتف</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              className="input-m text-left" type="tel" inputMode="tel"
              placeholder="03 123 456" dir="ltr" autoFocus />
          </div>
          <div>
            <label className="label-m">كلمة المرور</label>
            <input value={pass} onChange={e => setPass(e.target.value)}
              className="input-m" type="password" placeholder="••••••" dir="ltr"
              onKeyDown={e => e.key === 'Enter' && submit()} />
            <p className="text-mw-dim text-[10px] mt-1.5">أول مرة؟ سجّل رقمك وكلمة مرور جديدة</p>
          </div>
          {error && <p className="text-mw-red text-sm font-semibold animate-fade-in">{error}</p>}
          <button onClick={submit} disabled={loading || !phone || !pass} className="btn-amber">
            {loading ? (<><span className="w-4 h-4 border-2 border-mw-bg/30 border-t-mw-bg rounded-full spinner" /> جاري...</>) : 'دخول ⚡'}
          </button>
        </div>
        <p className="text-center text-mw-dim text-[10px]">Mawladi — تطبيق إدارة المولدات</p>
      </div>
    </div>
  )
}
