import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, ChevronLeft, Plus } from 'lucide-react'
import { format } from 'date-fns'

function money(n: any) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US') }

export default function Dashboard() {
  const nav = useNavigate()
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('3')
  const [saving, setSaving] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')

  const load = async () => {
    await supabase.rpc('mawladi_claim_buildings')
    const { data: blds } = await supabase.from('mawladi_buildings').select('*').order('name')
    const buildings = blds ?? []

    // Get payment stats per building
    const { data: payments } = await supabase.from('mawladi_payments').select('building_id, amount, status').eq('month', currentMonth)
    const { data: apts } = await supabase.from('mawladi_apartments').select('building_id').eq('is_active', true)

    const enriched = buildings.map(b => {
      const bPay = (payments ?? []).filter(p => p.building_id === b.id)
      const bApts = (apts ?? []).filter(a => a.building_id === b.id)
      return {
        ...b,
        aptCount: bApts.length,
        paid: bPay.filter(p => p.status === 'paid').length,
        unpaid: bPay.filter(p => p.status === 'unpaid').length,
        totalOwed: bPay.reduce((s, p) => s + Number(p.amount), 0),
      }
    })
    setBuildings(enriched)
    setLoading(false)

    // If only one building, go straight to it
    if (enriched.length === 1) nav(`/buildings/${enriched[0].id}`, { replace: true })
  }

  useEffect(() => { load() }, [])

  const addBuilding = async () => {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('mawladi_buildings').insert({
      name: name.trim(), address: address.trim() || null, price_per_amp: parseFloat(price) || 3,
      owner_id: (await supabase.auth.getUser()).data.user?.id,
    })
    setSaving(false); setShowAdd(false); setName(''); setAddress(''); setPrice('3')
    load()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="text-5xl mb-4">⚡</div>
      <p className="text-gradient text-lg font-black">Mawladi</p>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-mw-steel text-2xl font-black">⚡ المباني</h1>
        <button onClick={() => setShowAdd(true)} className="w-11 h-11 rounded-full bg-gradient-to-br from-mw-amber to-amber-600 flex items-center justify-center shadow-lg shadow-mw-amber/30 active:scale-90 transition-all">
          <Plus size={22} className="text-mw-bg" />
        </button>
      </div>

      {buildings.map((b, i) => (
        <Link key={b.id} to={`/buildings/${b.id}`} className={`card flex items-center gap-3 hover:-translate-y-0.5 transition-all animate-fade-up delay-${Math.min(i + 1, 6)}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${b.unpaid > 0 ? 'bg-red-500/15' : 'bg-green-500/15'}`}>
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-mw-steel font-bold text-base truncate">{b.name}</p>
            <p className="text-mw-dim text-xs">{b.aptCount} شقة{b.address ? ' · ' + b.address : ''}</p>
          </div>
          <div className="text-left shrink-0">
            {b.unpaid > 0 ? (
              <div>
                <p className="text-mw-red font-black text-sm">{b.unpaid} لم يدفع</p>
                <p className="text-mw-dim text-[10px]">{money(b.totalOwed)}</p>
              </div>
            ) : b.paid > 0 ? (
              <p className="text-mw-green font-bold text-sm">الكل دفع ✓</p>
            ) : (
              <p className="text-mw-dim text-xs">—</p>
            )}
          </div>
          <ChevronLeft size={14} className="text-mw-dim shrink-0" />
        </Link>
      ))}

      {buildings.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-5xl mb-4">🏢</p>
          <p className="text-mw-steel text-lg font-bold mb-2">أضف أول مبنى</p>
          <p className="text-mw-dim text-sm mb-4">أضف مبنى وشققه وابدأ بمتابعة الدفعات</p>
          <button onClick={() => setShowAdd(true)} className="btn-amber max-w-xs mx-auto">+ إضافة مبنى</button>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="card w-full max-w-sm space-y-4 animate-scale-in rounded-b-none sm:rounded-b-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-mw-steel font-black text-lg">🏢 مبنى جديد</h2>
            <div><label className="label-m">اسم المبنى *</label><input value={name} onChange={e => setName(e.target.value)} className="input-m text-lg" placeholder="بناية الأمين" autoFocus /></div>
            <div><label className="label-m">العنوان</label><input value={address} onChange={e => setAddress(e.target.value)} className="input-m" placeholder="شارع الأمير — زحلة" /></div>
            <div><label className="label-m">سعر الأمبير ($/شهر)</label><input value={price} onChange={e => setPrice(e.target.value)} className="input-m text-lg font-bold" type="number" inputMode="decimal" /></div>
            <button onClick={addBuilding} disabled={saving || !name.trim()} className="btn-amber text-base">{saving ? 'جاري...' : '+ إضافة مبنى'}</button>
            <button onClick={() => setShowAdd(false)} className="w-full py-2 text-mw-dim text-sm font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
