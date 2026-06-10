import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, ChevronLeft, Plus, MapPin } from 'lucide-react'

export default function Buildings() {
  const [buildings, setBuildings] = useState<any[]>([])
  const [apts, setApts] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('3')
  const [saving, setSaving] = useState(false)

  const load = () => {
    supabase.from('mawladi_buildings').select('*').order('name').then(({ data }) => setBuildings(data ?? []))
    supabase.from('mawladi_apartments').select('building_id').eq('is_active', true).then(({ data }) => setApts(data ?? []))
  }
  useEffect(() => { load() }, [])

  const getCount = (bid: string) => apts.filter(a => a.building_id === bid).length

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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-1"><MapPin size={14} className="text-mw-amber" /><p className="text-mw-dim text-[10px] font-bold tracking-wider">إدارة المباني</p></div>
          <h1 className="text-mw-steel text-2xl font-black">المباني</h1>
          <p className="text-mw-dim text-xs mt-0.5">{buildings.length} مبنى</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-11 h-11 rounded-full bg-gradient-to-br from-mw-amber to-amber-600 flex items-center justify-center shadow-lg shadow-mw-amber/30 active:scale-90 transition-all">
          <Plus size={22} className="text-mw-bg" />
        </button>
      </div>

      {buildings.map((b, i) => (
        <Link key={b.id} to={`/buildings/${b.id}`} className={`card flex items-center gap-3 hover:border-mw-amber/30 hover:-translate-y-0.5 transition-all duration-200 animate-slide-right delay-${Math.min(i + 1, 6)}`}>
          <div className="w-12 h-12 rounded-xl bg-mw-amber/15 flex items-center justify-center shrink-0"><Building2 size={22} className="text-mw-amber" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-mw-steel font-bold text-sm truncate">{b.name}</p>
            <p className="text-mw-dim text-[10px]">{b.address ? b.address + ' · ' : ''}{getCount(b.id)} شقة · ${b.price_per_amp}/أمبير</p>
          </div>
          <ChevronLeft size={14} className="text-mw-dim shrink-0" />
        </Link>
      ))}

      {buildings.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-mw-dim text-sm">أضف أول مبنى للبدء</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="card w-full max-w-sm space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-mw-steel font-black text-lg flex items-center gap-2">🏢 مبنى جديد</h2>
            <div><label className="label-m">اسم المبنى *</label><input value={name} onChange={e => setName(e.target.value)} className="input-m" placeholder="بناية الأمين" autoFocus /></div>
            <div><label className="label-m">العنوان</label><input value={address} onChange={e => setAddress(e.target.value)} className="input-m" placeholder="شارع الأمير — زحلة" /></div>
            <div><label className="label-m">سعر الأمبير ($/شهر)</label><input value={price} onChange={e => setPrice(e.target.value)} className="input-m" type="number" inputMode="decimal" placeholder="3" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={addBuilding} disabled={saving || !name.trim()} className="btn-amber flex-1">{saving ? 'جاري...' : 'إضافة'}</button>
              <button onClick={() => setShowAdd(false)} className="btn-ghost">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
