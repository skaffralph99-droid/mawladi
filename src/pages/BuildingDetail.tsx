import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Plus, Zap, Check, X, Phone, RefreshCw, Users } from 'lucide-react'
import { format } from 'date-fns'

function money(n: any) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US') }

export default function BuildingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [building, setBuilding] = useState<any>(null)
  const [apartments, setApartments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddApt, setShowAddApt] = useState(false)
  const [aptNum, setAptNum] = useState('')
  const [aptFloor, setAptFloor] = useState('')
  const [aptTenant, setAptTenant] = useState('')
  const [aptPhone, setAptPhone] = useState('')
  const [aptAmps, setAptAmps] = useState('10')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<'apartments' | 'billing'>('billing')

  const currentMonth = format(new Date(), 'yyyy-MM')
  const monthLabel = format(new Date(), 'MMMM yyyy')

  const load = () => {
    if (!id) return
    Promise.all([
      supabase.from('mawladi_buildings').select('*').eq('id', id).single(),
      supabase.from('mawladi_apartments').select('*').eq('building_id', id).eq('is_active', true).order('number'),
      supabase.from('mawladi_payments').select('*').eq('building_id', id).eq('month', currentMonth).order('created_at'),
    ]).then(([b, a, p]) => {
      setBuilding(b.data); setApartments(a.data ?? []); setPayments(p.data ?? [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex items-center justify-center h-[60vh] text-mw-dim text-sm">جاري التحميل...</div>
  if (!building) return <div className="p-4 text-center py-20"><p className="text-mw-dim text-sm">مبنى غير موجود</p></div>

  const totalOwed = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const unpaidCount = payments.filter(p => p.status === 'unpaid').length
  const paidCount = payments.filter(p => p.status === 'paid').length

  const addApartment = async () => {
    if (!aptNum.trim()) return
    setSaving(true)
    await supabase.from('mawladi_apartments').insert({
      building_id: id, number: aptNum.trim(), floor: aptFloor.trim() || null,
      tenant_name: aptTenant.trim() || null, tenant_phone: aptPhone.trim() || null,
      amps: parseFloat(aptAmps) || 10,
    })
    setSaving(false); setShowAddApt(false)
    setAptNum(''); setAptFloor(''); setAptTenant(''); setAptPhone(''); setAptAmps('10')
    load()
  }

  const generateBills = async () => {
    setGenerating(true)
    await supabase.rpc('mawladi_generate_bills', { p_building_id: id, p_month: currentMonth })
    setGenerating(false)
    load()
  }

  const togglePayment = async (paymentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    await supabase.from('mawladi_payments').update({
      status: newStatus,
      paid_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
    }).eq('id', paymentId)
    load()
  }

  const getPayment = (aptId: string) => payments.find(p => p.apartment_id === aptId)

  const whatsappMsg = (apt: any, amount: number) => {
    const msg = `مرحبا ${apt.tenant_name || ''}، فاتورة الكهرباء لشهر ${monthLabel} — $${amount}. الرجاء الدفع.\n\n_Mawladi ⚡ — تطبيق إدارة المولدات_`
    return `https://wa.me/${(apt.tenant_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => nav('/buildings')} className="text-mw-amber text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all animate-fade-up"><ArrowRight size={16} /> المباني</button>

      {/* Header */}
      <div className="card animate-fade-up delay-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-mw-amber/15 flex items-center justify-center text-2xl">🏢</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-mw-steel text-xl font-black truncate">{building.name}</h1>
            <p className="text-mw-dim text-xs mt-0.5">{building.address ? building.address + ' · ' : ''}${building.price_per_amp}/أمبير</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-mw-elevated rounded-xl p-3 text-center">
            <p className="text-mw-amber text-base font-black">{apartments.length}</p>
            <p className="text-mw-dim text-[10px] mt-0.5">شقة</p>
          </div>
          <div className="bg-mw-elevated rounded-xl p-3 text-center">
            <p className="text-mw-green text-base font-black">{money(totalPaid)}</p>
            <p className="text-mw-dim text-[10px] mt-0.5">مدفوع</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${unpaidCount > 0 ? 'kpi-red' : 'kpi-green'} border`}>
            <p className={`text-base font-black ${unpaidCount > 0 ? 'text-mw-red' : 'text-mw-green'}`}>{unpaidCount > 0 ? money(totalOwed - totalPaid) : '✓'}</p>
            <p className="text-mw-dim text-[10px] mt-0.5">{unpaidCount > 0 ? `${unpaidCount} لم يدفع` : 'الكل دفع'}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up delay-2">
        <button onClick={() => setShowAddApt(true)} className="card flex items-center justify-center gap-2 py-3.5 border-mw-amber/30 hover:border-mw-amber hover:-translate-y-0.5 transition-all">
          <Plus size={16} className="text-mw-amber" />
          <span className="text-mw-steel text-sm font-bold">إضافة شقة</span>
        </button>
        <button onClick={generateBills} disabled={generating || apartments.length === 0} className="card flex items-center justify-center gap-2 py-3.5 border-mw-green/30 hover:border-mw-green hover:-translate-y-0.5 transition-all">
          {generating ? <span className="w-4 h-4 border-2 border-mw-green/30 border-t-mw-green rounded-full spinner" /> : <RefreshCw size={16} className="text-mw-green" />}
          <span className="text-mw-steel text-sm font-bold">فواتير الشهر</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 animate-fade-up delay-3">
        <button onClick={() => setTab('billing')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'billing' ? 'bg-mw-amber text-mw-bg' : 'bg-mw-elevated text-mw-dim'}`}>
          💰 الفواتير ({payments.length})
        </button>
        <button onClick={() => setTab('apartments')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'apartments' ? 'bg-mw-amber text-mw-bg' : 'bg-mw-elevated text-mw-dim'}`}>
          <Users size={14} className="inline ml-1" /> الشقق ({apartments.length})
        </button>
      </div>

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="animate-fade-up delay-4">
          <p className="section-title">فواتير {monthLabel}</p>
          {payments.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-mw-dim text-sm">لا توجد فواتير — اضغط "فواتير الشهر" لتوليدها</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const apt = apartments.find(a => a.id === p.apartment_id)
                if (!apt) return null
                const isPaid = p.status === 'paid'
                return (
                  <div key={p.id} className={`card flex items-center gap-3 py-3 transition-all ${isPaid ? 'border-mw-green/20' : 'border-mw-red/20'}`}>
                    <button onClick={() => togglePayment(p.id, p.status)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${isPaid ? 'bg-mw-green/20 text-mw-green' : 'bg-mw-red/15 text-mw-red'}`}>
                      {isPaid ? <Check size={20} /> : <X size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-mw-steel text-sm font-bold">شقة {apt.number}{apt.floor ? ` · ط${apt.floor}` : ''}</p>
                      <p className="text-mw-dim text-[10px] truncate">{apt.tenant_name || 'بدون اسم'} · {apt.amps} أمبير</p>
                    </div>
                    <p className={`font-black text-sm shrink-0 ${isPaid ? 'text-mw-green' : 'text-mw-red'}`}>{money(p.amount)}</p>
                    {!isPaid && apt.tenant_phone && (
                      <a href={whatsappMsg(apt, Number(p.amount))} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 hover:bg-green-500/25 transition-all active:scale-90 shrink-0">
                        <Phone size={15} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {/* Summary bar */}
          {payments.length > 0 && (
            <div className="card mt-3 flex items-center justify-between kpi-amber border">
              <div className="text-center flex-1">
                <p className="text-mw-green font-black text-lg">{paidCount}</p>
                <p className="text-mw-dim text-[9px]">دفعو ✓</p>
              </div>
              <div className="w-px h-8 bg-mw-border" />
              <div className="text-center flex-1">
                <p className="text-mw-red font-black text-lg">{unpaidCount}</p>
                <p className="text-mw-dim text-[9px]">لم يدفعو ✗</p>
              </div>
              <div className="w-px h-8 bg-mw-border" />
              <div className="text-center flex-1">
                <p className="text-mw-amber font-black text-lg">{money(totalOwed)}</p>
                <p className="text-mw-dim text-[9px]">الإجمالي</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apartments tab */}
      {tab === 'apartments' && (
        <div className="animate-fade-up delay-4">
          <p className="section-title">الشقق المشتركة</p>
          {apartments.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🏠</p>
              <p className="text-mw-dim text-sm">لا توجد شقق — أضف أول شقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apartments.map((a, i) => {
                const pay = getPayment(a.id)
                return (
                  <div key={a.id} className={`card flex items-center gap-3 py-3 animate-slide-right delay-${Math.min(i + 1, 6)}`}>
                    <div className="w-10 h-10 rounded-xl bg-mw-elevated flex items-center justify-center shrink-0">
                      <span className="text-mw-amber font-black text-sm">{a.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-mw-steel text-sm font-bold">{a.tenant_name || 'شقة ' + a.number}</p>
                      <p className="text-mw-dim text-[10px]">{a.floor ? `ط${a.floor} · ` : ''}{a.amps} أمبير · {money(Number(a.amps) * Number(building.price_per_amp))}/شهر</p>
                    </div>
                    {pay && (
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${pay.status === 'paid' ? 'bg-mw-green/15 text-mw-green' : 'bg-mw-red/15 text-mw-red'}`}>
                        {pay.status === 'paid' ? 'دفع ✓' : 'لم يدفع'}
                      </div>
                    )}
                    {a.tenant_phone && (
                      <a href={`https://wa.me/${a.tenant_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-mw-dim hover:text-green-400 transition-colors shrink-0">
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add apartment modal */}
      {showAddApt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddApt(false)}>
          <div className="card w-full max-w-sm space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-mw-steel font-black text-lg flex items-center gap-2">🏠 شقة جديدة</h2>
            <div><label className="label-m">رقم الشقة *</label><input value={aptNum} onChange={e => setAptNum(e.target.value)} className="input-m" placeholder="3" autoFocus /></div>
            <div><label className="label-m">الطابق</label><input value={aptFloor} onChange={e => setAptFloor(e.target.value)} className="input-m" placeholder="2" /></div>
            <div><label className="label-m">اسم المستأجر</label><input value={aptTenant} onChange={e => setAptTenant(e.target.value)} className="input-m" placeholder="أحمد" /></div>
            <div><label className="label-m">رقم الهاتف (WhatsApp)</label><input value={aptPhone} onChange={e => setAptPhone(e.target.value)} className="input-m" placeholder="96171234567" dir="ltr" /></div>
            <div>
              <label className="label-m">عدد الأمبير</label>
              <input value={aptAmps} onChange={e => setAptAmps(e.target.value)} className="input-m" type="number" inputMode="decimal" placeholder="10" />
              {aptAmps && building && (
                <p className="text-mw-amber text-xs mt-1.5 font-bold">الفاتورة الشهرية: {money(parseFloat(aptAmps) * Number(building.price_per_amp))}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={addApartment} disabled={saving || !aptNum.trim()} className="btn-amber flex-1">{saving ? 'جاري...' : 'إضافة'}</button>
              <button onClick={() => setShowAddApt(false)} className="btn-ghost">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
