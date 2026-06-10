import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Building2, Users, DollarSign, AlertTriangle, ChevronLeft, Plus, Zap } from 'lucide-react'
import { format } from 'date-fns'

function money(n: any) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US') }

export default function Dashboard() {
  const [buildings, setBuildings] = useState<any[]>([])
  const [apartments, setApartments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    Promise.all([
      supabase.from('mawladi_buildings').select('*').order('name'),
      supabase.from('mawladi_apartments').select('*').eq('is_active', true),
      supabase.from('mawladi_payments').select('*').eq('month', currentMonth),
    ]).then(([b, a, p]) => {
      setBuildings(b.data ?? []); setApartments(a.data ?? []); setPayments(p.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="text-5xl mb-4" style={{ animation: 'fadeUp 0.6s ease-out' }}>⚡</div>
      <p className="text-gradient text-lg font-black">Mawladi</p>
      <div className="flex gap-1.5 mt-4"><div className="w-2 h-2 rounded-full bg-mw-amber animate-pulse" /><div className="w-2 h-2 rounded-full bg-mw-amber animate-pulse delay-2" /><div className="w-2 h-2 rounded-full bg-mw-amber animate-pulse delay-4" /></div>
    </div>
  )

  const totalApts = apartments.length
  const totalOwed = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const totalUnpaid = totalOwed - totalPaid
  const unpaidCount = payments.filter(p => p.status === 'unpaid').length

  const buildingStats = buildings.map(b => {
    const apts = apartments.filter(a => a.building_id === b.id)
    const bPayments = payments.filter(p => p.building_id === b.id)
    const paid = bPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
    const owed = bPayments.reduce((s, p) => s + Number(p.amount), 0)
    const unpaid = bPayments.filter(p => p.status === 'unpaid').length
    return { ...b, aptCount: apts.length, paid, owed, unpaid }
  })

  return (
    <div className="p-4 space-y-5">
      {/* Hero */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-mw-amber" />
          <p className="text-mw-dim text-[10px] font-bold tracking-wider">{format(new Date(), 'MMMM yyyy').toUpperCase()}</p>
        </div>
        <h1 className="text-mw-steel text-2xl font-black">مرحباً ⚡</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card kpi-amber animate-fade-up delay-1 border">
          <div className="flex items-center gap-2 mb-2"><Building2 size={14} className="text-mw-amber" /><p className="text-mw-amber text-[10px] font-bold">المباني</p></div>
          <p className="text-3xl font-black text-white">{buildings.length}</p>
          <p className="text-mw-amber/50 text-[10px] mt-0.5">{totalApts} شقة</p>
        </div>
        <div className="card kpi-green animate-fade-up delay-2 border">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={14} className="text-mw-green" /><p className="text-green-300 text-[10px] font-bold">تم الدفع</p></div>
          <p className="text-3xl font-black text-white">{money(totalPaid)}</p>
          <p className="text-green-300/50 text-[10px] mt-0.5">هذا الشهر</p>
        </div>
        <div className="card kpi-red animate-fade-up delay-3 border">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-mw-red" /><p className="text-red-300 text-[10px] font-bold">لم يدفع</p></div>
          <p className="text-3xl font-black text-white">{money(totalUnpaid)}</p>
          <p className="text-red-300/50 text-[10px] mt-0.5">{unpaidCount} شقة</p>
        </div>
        <div className="card kpi-blue animate-fade-up delay-4 border animate-glow">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={14} className="text-blue-400" /><p className="text-blue-300 text-[10px] font-bold">إجمالي الشهر</p></div>
          <p className="text-3xl font-black text-white">{money(totalOwed)}</p>
          <p className="text-blue-300/50 text-[10px] mt-0.5">المطلوب</p>
        </div>
      </div>

      {/* Add building CTA */}
      <Link to="/buildings" className="block animate-fade-up delay-5">
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B, #FBBF24)' }}>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Plus size={24} className="text-mw-bg" /></div>
            <div>
              <p className="text-mw-bg font-black text-base">إدارة المباني</p>
              <p className="text-mw-bg/70 text-xs">أضف مبنى جديد أو تصفح المباني</p>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>
      </Link>

      {/* Buildings list */}
      {buildingStats.length > 0 && (
        <div className="animate-fade-up delay-6">
          <p className="section-title">المباني</p>
          <div className="space-y-2.5">
            {buildingStats.map((b, i) => (
              <Link key={b.id} to={`/buildings/${b.id}`} className={`card flex items-center gap-3 hover:border-mw-amber/30 hover:-translate-y-0.5 transition-all duration-200 animate-slide-right delay-${Math.min(i + 1, 6)}`}>
                <div className="w-11 h-11 rounded-xl bg-mw-amber/15 flex items-center justify-center shrink-0"><Building2 size={20} className="text-mw-amber" /></div>
                <div className={`w-1 self-stretch rounded-full shrink-0 ${b.unpaid > 0 ? 'bg-mw-red' : 'bg-mw-green'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-mw-steel font-bold text-sm truncate">{b.name}</p>
                  <p className="text-mw-dim text-[10px]">{b.aptCount} شقة · {money(b.owed)} مطلوب</p>
                </div>
                <div className="text-left min-w-[56px] shrink-0">
                  {b.unpaid > 0 ? (
                    <p className="text-mw-red text-sm font-black">{b.unpaid} ✗</p>
                  ) : b.owed > 0 ? (
                    <p className="text-mw-green text-sm font-black">✓</p>
                  ) : (
                    <p className="text-mw-dim text-sm">—</p>
                  )}
                </div>
                <ChevronLeft size={14} className="text-mw-dim shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {buildings.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-mw-dim text-sm">لا توجد مباني بعد</p>
          <Link to="/buildings" className="text-mw-amber text-sm font-bold mt-2 inline-block">إضافة أول مبنى ←</Link>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
