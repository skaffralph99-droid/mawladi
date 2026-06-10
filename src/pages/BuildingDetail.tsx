import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Plus, Check, X, Phone, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

function money(n: any) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US') }

export default function BuildingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [building, setBuilding] = useState<any>(null)
  const [apartments, setApartments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [num, setNum] = useState('')
  const [floor, setFloor] = useState('')
  const [tenant, setTenant] = useState('')
  const [phone, setPhone] = useState('')
  const [amps, setAmps] = useState('10')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const monthLabel = format(new Date(), 'MMMM yyyy')

  const load = () => {
    if (!id) return
    Promise.all([
      supabase.from('mawladi_buildings').select('*').eq('id', id).single(),
      supabase.from('mawladi_apartments').select('*').eq('building_id', id).eq('is_active', true).order('number'),
      supabase.from('mawladi_payments').select('*').eq('building_id', id).eq('month', currentMonth),
    ]).then(([b, a, p]) => {
      setBuilding(b.data); setApartments(a.data ?? []); setPayments(p.data ?? [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-mw-dim">⚡</div>
  if (!building) return <div className="p-4 text-center py-20"><p className="text-mw-dim">مبنى غير موجود</p></div>

  const totalOwed = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const unpaidCount = payments.filter(p => p.status === 'unpaid').length
  const hasBills = payments.length > 0

  const generateBills = async () => {
    setGenerating(true)
    await supabase.rpc('mawladi_generate_bills', { p_building_id: id, p_month: currentMonth })
    setGenerating(false)
    load()
  }

  const togglePay = async (payId: string, current: string) => {
    const next = current === 'paid' ? 'unpaid' : 'paid'
    await supabase.from('mawladi_payments').update({
      status: next, paid_date: next === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
    }).eq('id', payId)
    load()
  }

  const addApt = async () => {
    if (!num.trim()) return
    setSaving(true)
    await supabase.from('mawladi_apartments').insert({
      building_id: id, number: num.trim(), floor: floor.trim() || null,
      tenant_name: tenant.trim() || null, tenant_phone: phone.trim() || null,
      amps: parseFloat(amps) || 10,
    })
    setSaving(false); setShowAdd(false)
    setNum(''); setFloor(''); setTenant(''); setPhone(''); setAmps('10')
    load()
  }

  const waMsg = (apt: any, amount: number) => {
    const msg = `مرحبا ${apt.tenant_name || ''}، فاتورة المولد لشهر ${monthLabel} — $${amount}. الرجاء الدفع.\n\n_Mawladi ⚡ — تطبيق إدارة المولدات_\nwa.me/96171000000`
    return `https://wa.me/${(apt.tenant_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="p-4 space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3 animate-fade-up">
        <button onClick={() => nav('/')} className="w-9 h-9 rounded-xl bg-mw-elevated flex items-center justify-center"><ArrowRight size={18} className="text-mw-amber" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-mw-steel text-xl font-black truncate">{building.name}</h1>
          <p className="text-mw-dim text-xs">{apartments.length} شقة · ${building.price_per_amp}/أمبير</p>
        </div>
      </div>

      {/* Summary bar */}
      {hasBills && (
        <div className="flex gap-2 animate-fade-up delay-1">
          <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-mw-green font-black text-xl">{money(totalPaid)}</p>
            <p className="text-mw-dim text-[10px]">مدفوع</p>
          </div>
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-mw-red font-black text-xl">{money(totalOwed - totalPaid)}</p>
            <p className="text-mw-dim text-[10px]">{unpaidCount} لم يدفع</p>
          </div>
          <div className="flex-1 bg-mw-amber/10 border border-mw-amber/20 rounded-xl p-3 text-center">
            <p className="text-mw-amber font-black text-xl">{money(totalOwed)}</p>
            <p className="text-mw-dim text-[10px]">الإجمالي</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 animate-fade-up delay-2">
        <button onClick={generateBills} disabled={generating || apartments.length === 0}
          className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-mw-amber/15 border border-mw-amber/30 text-mw-amber active:scale-95 transition-all disabled:opacity-40">
          {generating ? <span className="w-4 h-4 border-2 border-mw-amber/30 border-t-mw-amber rounded-full spinner" /> : <RefreshCw size={16} />}
          فواتير الشهر
        </button>
        <button onClick={() => setShowAdd(true)}
          className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-mw-elevated border border-mw-border text-mw-dim active:scale-95 transition-all">
          <Plus size={16} /> شقة جديدة
        </button>
      </div>

      {/* Apartment list with payment status */}
      {!hasBills && apartments.length > 0 && (
        <div className="card text-center py-6 animate-fade-up delay-3">
          <p className="text-mw-dim text-sm">اضغط <span className="text-mw-amber font-bold">"فواتير الشهر"</span> لتوليد فواتير كل الشقق</p>
        </div>
      )}

      {apartments.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-mw-dim text-sm">أضف الشقق أولاً</p>
        </div>
      )}

      <div className="space-y-2">
        {apartments.map((apt, i) => {
          const pay = payments.find(p => p.apartment_id === apt.id)
          const isPaid = pay?.status === 'paid'
          const bill = Number(apt.amps) * Number(building.price_per_amp)

          return (
            <div key={apt.id} className={`card flex items-center gap-3 py-3 animate-fade-up delay-${Math.min(i + 3, 6)}`}>
              {/* Payment toggle — big, easy to tap */}
              {pay ? (
                <button onClick={() => togglePay(pay.id, pay.status)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all ${isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {isPaid ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />}
                </button>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-mw-elevated flex items-center justify-center shrink-0">
                  <span className="text-mw-amber font-black">{apt.number}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-mw-steel font-bold text-sm">
                  {apt.tenant_name || 'شقة ' + apt.number}
                  {apt.floor && <span className="text-mw-dim font-normal"> · ط{apt.floor}</span>}
                </p>
                <p className="text-mw-dim text-xs">{apt.amps} أمبير · {money(bill)}/شهر</p>
              </div>

              {/* Amount */}
              <p className={`font-black text-base shrink-0 ${pay ? (isPaid ? 'text-green-400' : 'text-red-400') : 'text-mw-dim'}`}>
                {money(pay ? pay.amount : bill)}
              </p>

              {/* WhatsApp button */}
              {pay && !isPaid && apt.tenant_phone && (
                <a href={waMsg(apt, Number(pay.amount))} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 active:scale-90 transition-all shrink-0">
                  <Phone size={18} />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Add apartment modal — slides up from bottom like WhatsApp */}
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
            <div>
              <label className="label-m">عدد الأمبير</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(a => (
                  <button key={a} onClick={() => setAmps(String(a))}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 ${amps === String(a) ? 'bg-mw-amber border-mw-amber text-mw-bg' : 'bg-mw-elevated border-mw-border text-mw-dim'}`}>
                    {a}A
                  </button>
                ))}
              </div>
              <p className="text-mw-amber text-xs mt-2 font-bold text-center">الفاتورة: {money((parseFloat(amps) || 0) * Number(building.price_per_amp))}/شهر</p>
            </div>
            <button onClick={addApt} disabled={saving || !num.trim()} className="btn-amber text-base">{saving ? 'جاري...' : '+ إضافة شقة'}</button>
            <button onClick={() => setShowAdd(false)} className="w-full py-2 text-mw-dim text-sm font-bold">إلغاء</button>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
