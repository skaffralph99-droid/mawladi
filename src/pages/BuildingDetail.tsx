import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Plus, Check, X, Phone, Zap, Fuel, Users, Wrench, MoreHorizontal, Trash2, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

function money(n: any) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US') }

const COST_TYPES = [
  { key: 'fuel', label: 'مازوت', icon: Fuel, color: 'text-orange-400' },
  { key: 'workers', label: 'عمال', icon: Users, color: 'text-blue-400' },
  { key: 'maintenance', label: 'صيانة', icon: Wrench, color: 'text-yellow-400' },
  { key: 'other', label: 'أخرى', icon: MoreHorizontal, color: 'text-mw-dim' },
]

export default function BuildingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [building, setBuilding] = useState<any>(null)
  const [apartments, setApartments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [num, setNum] = useState('')
  const [floor, setFloor] = useState('')
  const [tenant, setTenant] = useState('')
  const [phone, setPhone] = useState('')
  const [amps, setAmps] = useState('10')
  const [saving, setSaving] = useState(false)

  // Cost form
  const [costType, setCostType] = useState('fuel')
  const [costDesc, setCostDesc] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const [savingCost, setSavingCost] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const monthLabel = format(new Date(), 'MMMM yyyy')

  const load = async () => {
    if (!id) return
    const [b, a] = await Promise.all([
      supabase.from('mawladi_buildings').select('*').eq('id', id).single(),
      supabase.from('mawladi_apartments').select('*').eq('building_id', id).eq('is_active', true).order('number'),
    ])
    setBuilding(b.data); setApartments(a.data ?? [])
    if (b.data && (a.data ?? []).length > 0) {
      await supabase.rpc('mawladi_generate_bills', { p_building_id: id, p_month: currentMonth })
    }
    const [p, c] = await Promise.all([
      supabase.from('mawladi_payments').select('*').eq('building_id', id).eq('month', currentMonth),
      supabase.from('mawladi_costs').select('*').eq('building_id', id).eq('month', currentMonth).order('created_at'),
    ])
    setPayments(p.data ?? []); setCosts(c.data ?? []); setLoading(false)
  }
  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-mw-dim">⚡</div>
  if (!building) return <div className="p-4 text-center py-20"><p className="text-mw-dim">مبنى غير موجود</p></div>

  const isMetered = building.billing_type === 'metered'
  const totalOwed = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const unpaidCount = payments.filter(p => p.status === 'unpaid' && Number(p.amount) > 0).length
  const totalCosts = costs.reduce((s, c) => s + Number(c.amount), 0)
  const profit = totalPaid - totalCosts

  const togglePay = async (payId: string, current: string) => {
    const next = current === 'paid' ? 'unpaid' : 'paid'
    await supabase.from('mawladi_payments').update({ status: next, paid_date: next === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null }).eq('id', payId)
    load()
  }

  const updateReading = async (payId: string, aptId: string, value: string) => {
    const reading = parseFloat(value)
    if (isNaN(reading)) return
    const pay = payments.find(p => p.id === payId)
    const prev = Number(pay?.reading_prev ?? 0)
    const usage = Math.max(0, reading - prev)
    const amount = usage * Number(building.price_per_kwh)
    await supabase.from('mawladi_payments').update({ reading_current: reading, amount }).eq('id', payId)
    await supabase.from('mawladi_apartments').update({ last_reading: reading }).eq('id', aptId)
    load()
  }

  const addApt = async () => {
    if (!num.trim()) return
    setSaving(true)
    await supabase.from('mawladi_apartments').insert({
      building_id: id, number: num.trim(), floor: floor.trim() || null,
      tenant_name: tenant.trim() || null, tenant_phone: phone.trim() || null,
      amps: parseFloat(amps) || 10, last_reading: 0,
    })
    setSaving(false); setShowAdd(false)
    setNum(''); setFloor(''); setTenant(''); setPhone(''); setAmps('10')
    load()
  }

  const addCost = async () => {
    if (!costAmount) return
    setSavingCost(true)
    await supabase.from('mawladi_costs').insert({
      building_id: id, month: currentMonth, type: costType,
      description: costDesc.trim() || COST_TYPES.find(t => t.key === costType)?.label || '',
      amount: parseFloat(costAmount) || 0,
    })
    setSavingCost(false); setShowAddCost(false)
    setCostType('fuel'); setCostDesc(''); setCostAmount('')
    load()
  }

  const deleteCost = async (costId: string) => {
    await supabase.from('mawladi_costs').delete().eq('id', costId)
    load()
  }

  const waMsg = (apt: any, amount: number) => {
    const msg = `مرحبا ${apt.tenant_name || ''}، فاتورة المولد لشهر ${monthLabel} — $${Math.round(amount)}. الرجاء الدفع.\n\n_Mawladi ⚡ — تطبيق إدارة المولدات_`
    return `https://wa.me/${(apt.tenant_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 animate-fade-up">
        <button onClick={() => nav('/')} className="w-9 h-9 rounded-xl bg-mw-elevated flex items-center justify-center"><ArrowRight size={18} className="text-mw-amber" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-mw-steel text-xl font-black truncate">{building.name}</h1>
          <p className="text-mw-dim text-xs">
            {apartments.length} شقة · {isMetered ? `$${building.price_per_kwh}/kWh` : `$${building.price_per_amp}/أمبير`}
          </p>
        </div>
      </div>

      {/* Summary — collected, costs, PROFIT */}
      {(totalOwed > 0 || totalCosts > 0) && (
        <div className="animate-fade-up delay-1">
          <div className="flex gap-2">
            <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-mw-green font-black text-lg">{money(totalPaid)}</p>
              <p className="text-mw-dim text-[10px]">تم جمعو</p>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-mw-red font-black text-lg">{money(totalCosts)}</p>
              <p className="text-mw-dim text-[10px]">المصاريف</p>
            </div>
            <div className={`flex-1 rounded-xl p-3 text-center border ${profit >= 0 ? 'bg-mw-amber/10 border-mw-amber/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp size={12} className={profit >= 0 ? 'text-mw-amber' : 'text-mw-red'} />
                <p className={`font-black text-lg ${profit >= 0 ? 'text-mw-amber' : 'text-mw-red'}`}>{money(profit)}</p>
              </div>
              <p className="text-mw-dim text-[10px]">الربح</p>
            </div>
          </div>
          {unpaidCount > 0 && (
            <p className="text-mw-red text-[10px] font-bold mt-2 text-center">{unpaidCount} شقة لم تدفع بعد — {money(totalOwed - totalPaid)} باقي</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 animate-fade-up delay-2">
        <button onClick={() => setShowAdd(true)} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-mw-elevated border border-mw-border text-mw-dim active:scale-95 transition-all">
          <Plus size={16} /> شقة جديدة
        </button>
        <button onClick={() => setShowAddCost(true)} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-mw-elevated border border-mw-border text-mw-dim active:scale-95 transition-all">
          <Fuel size={16} /> مصروف جديد
        </button>
      </div>

      {apartments.length === 0 && (
        <div className="text-center py-12 animate-fade-in"><p className="text-4xl mb-3">🏠</p><p className="text-mw-dim text-sm">أضف الشقق أولاً</p></div>
      )}

      {/* Apartment list */}
      <div className="space-y-2">
        {apartments.map((apt, i) => {
          const pay = payments.find(p => p.apartment_id === apt.id)
          const isPaid = pay?.status === 'paid'
          const hasReading = pay && pay.reading_current != null && Number(pay.amount) > 0
          const bill = isMetered ? Number(pay?.amount ?? 0) : Number(apt.amps) * Number(building.price_per_amp)
          const usage = pay ? Math.max(0, Number(pay.reading_current ?? 0) - Number(pay.reading_prev ?? 0)) : 0

          return (
            <div key={apt.id} className={`card py-3 space-y-2 animate-fade-up delay-${Math.min(i + 3, 6)}`}>
              <div className="flex items-center gap-3">
                {pay && (isMetered ? hasReading : true) ? (
                  <button onClick={() => togglePay(pay.id, pay.status)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all ${isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {isPaid ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />}
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-mw-elevated flex items-center justify-center shrink-0">
                    <span className="text-mw-amber font-black">{apt.number}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-mw-steel font-bold text-sm">
                    {apt.tenant_name || 'شقة ' + apt.number}
                    {apt.floor && <span className="text-mw-dim font-normal"> · ط{apt.floor}</span>}
                  </p>
                  {isMetered ? (
                    <p className="text-mw-dim text-xs">
                      عداد: {Number(pay?.reading_prev ?? apt.last_reading).toLocaleString()}
                      {hasReading && ` → ${Number(pay.reading_current).toLocaleString()} · ${usage.toLocaleString()} kWh`}
                    </p>
                  ) : (
                    <p className="text-mw-dim text-xs">{apt.amps} أمبير · {money(bill)}/شهر</p>
                  )}
                </div>
                {(isMetered ? hasReading : true) && (
                  <p className={`font-black text-base shrink-0 ${pay ? (isPaid ? 'text-green-400' : 'text-red-400') : 'text-mw-dim'}`}>
                    {money(bill)}
                  </p>
                )}
                {pay && !isPaid && Number(pay.amount) > 0 && apt.tenant_phone && (
                  <a href={waMsg(apt, Number(pay.amount))} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 active:scale-90 transition-all shrink-0">
                    <Phone size={18} />
                  </a>
                )}
              </div>
              {isMetered && pay && !hasReading && !isPaid && (
                <div className="flex items-center gap-2 mr-14">
                  <Zap size={14} className="text-mw-amber shrink-0" />
                  <input type="number" inputMode="decimal" placeholder="أدخل قراءة العداد" className="input-m text-sm py-2 flex-1" dir="ltr"
                    onBlur={e => { if (e.target.value) updateReading(pay.id, apt.id, e.target.value) }}
                    onKeyDown={e => { if (e.key === 'Enter') { const t = e.target as HTMLInputElement; if (t.value) { updateReading(pay.id, apt.id, t.value); t.blur() } } }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Costs section */}
      {costs.length > 0 && (
        <div className="animate-fade-up delay-5">
          <p className="text-mw-red/70 text-[11px] font-bold tracking-widest uppercase mb-3">📊 مصاريف الشهر</p>
          <div className="space-y-2">
            {costs.map(c => {
              const ct = COST_TYPES.find(t => t.key === c.type) || COST_TYPES[3]
              const Icon = ct.icon
              return (
                <div key={c.id} className="card py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-mw-elevated flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={ct.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-mw-steel font-bold text-sm">{c.description || ct.label}</p>
                    <p className="text-mw-dim text-[10px]">{ct.label}</p>
                  </div>
                  <p className="text-mw-red font-black text-base shrink-0">-{money(c.amount)}</p>
                  <button onClick={() => deleteCost(c.id)} className="text-mw-dim hover:text-mw-red transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add apartment modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="card w-full max-w-sm space-y-3 animate-scale-in rounded-b-none sm:rounded-b-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-mw-steel font-black text-lg">🏠 شقة جديدة</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-m">رقم الشقة *</label><input value={num} onChange={e => setNum(e.target.value)} className="input-m text-lg text-center font-bold" placeholder="3" autoFocus /></div>
              <div><label className="label-m">الطابق</label><input value={floor} onChange={e => setFloor(e.target.value)} className="input-m text-lg text-center" placeholder="2" /></div>
            </div>
            <div><label className="label-m">اسم المستأجر</label><input value={tenant} onChange={e => setTenant(e.target.value)} className="input-m" placeholder="أحمد خليل" /></div>
            <div><label className="label-m">رقم واتساب</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-m" type="tel" inputMode="tel" placeholder="96171234567" dir="ltr" /></div>
            {!isMetered && (
              <div>
                <label className="label-m">عدد الأمبير</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(a => (
                    <button key={a} onClick={() => setAmps(String(a))} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 ${amps === String(a) ? 'bg-mw-amber border-mw-amber text-mw-bg' : 'bg-mw-elevated border-mw-border text-mw-dim'}`}>{a}A</button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={addApt} disabled={saving || !num.trim()} className="btn-amber text-base">{saving ? 'جاري...' : '+ إضافة شقة'}</button>
            <button onClick={() => setShowAdd(false)} className="w-full py-2 text-mw-dim text-sm font-bold">إلغاء</button>
          </div>
        </div>
      )}

      {/* Add cost modal */}
      {showAddCost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowAddCost(false)}>
          <div className="card w-full max-w-sm space-y-4 animate-scale-in rounded-b-none sm:rounded-b-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-mw-steel font-black text-lg">📊 مصروف جديد</h2>
            <div>
              <label className="label-m">نوع المصروف</label>
              <div className="flex gap-2">
                {COST_TYPES.map(ct => (
                  <button key={ct.key} onClick={() => { setCostType(ct.key); if (!costDesc) setCostDesc(ct.label) }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 flex flex-col items-center gap-1 ${costType === ct.key ? 'bg-mw-amber border-mw-amber text-mw-bg' : 'bg-mw-elevated border-mw-border text-mw-dim'}`}>
                    <ct.icon size={16} />
                    <span className="text-[10px]">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><label className="label-m">الوصف</label><input value={costDesc} onChange={e => setCostDesc(e.target.value)} className="input-m" placeholder="مازوت، راتب، صيانة..." /></div>
            <div>
              <label className="label-m">المبلغ ($)</label>
              <input value={costAmount} onChange={e => setCostAmount(e.target.value)} className="input-m text-center text-2xl font-black" type="number" inputMode="decimal" placeholder="0" />
            </div>
            <button onClick={addCost} disabled={savingCost || !costAmount} className="btn-amber text-base">{savingCost ? 'جاري...' : '+ إضافة مصروف'}</button>
            <button onClick={() => setShowAddCost(false)} className="w-full py-2 text-mw-dim text-sm font-bold">إلغاء</button>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
