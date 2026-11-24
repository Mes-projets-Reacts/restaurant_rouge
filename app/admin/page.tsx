'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { formatFCFA, getDakarDate } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  Truck,
  Utensils,
  Clock,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const [ordersRes, dishesRes] = await Promise.all([
        supabase.from('orders').select('total, delivery_mode, created_at'),
        supabase.from('dishes').select('id, is_available'),
      ])

      const orders = ordersRes.data || []
      const today = getDakarDate()
      const todayOrders = orders.filter((o: any) =>
        getDakarDate(new Date(o.created_at)) === today
      )

      const totalRevenue = todayOrders.reduce(
        (sum: number, o: any) => sum + (o.total || 0),
        0
      )
      const allTimeRevenue = orders.reduce(
        (sum: number, o: any) => sum + (o.total || 0),
        0
      )
      const modeCounts = {
        on_site: orders.filter((o: any) => o.delivery_mode === 'on_site').length,
        takeaway: orders.filter((o: any) => o.delivery_mode === 'takeaway').length,
        delivery: orders.filter((o: any) => o.delivery_mode === 'delivery').length,
      }
      const modeTotal = Object.values(modeCounts).reduce((sum, count) => sum + count, 0)

      setStats({
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        todayRevenue: totalRevenue,
        allTimeRevenue,
        availableDishes: (dishesRes.data || []).filter(
          (d: any) => d.is_available
        ).length,
        modeCounts,
        modeTotal,
      })
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) return <div className="h-64 flex items-center justify-center">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Commandes totales"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Commandes aujourd'hui"
          value={stats.todayOrders}
          icon={<Clock className="w-5 h-5" />}
          color="bg-orange-500"
        />
        <StatCard
          title="CA aujourd'hui"
          value={formatFCFA(stats.todayRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-green-500"
        />
        <StatCard
          title="CA cumulé"
          value={formatFCFA(stats.allTimeRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-emerald-700"
        />
        <StatCard
          title="Plats disponibles"
          value={stats.availableDishes}
          icon={<Utensils className="w-5 h-5" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Répartition des modes</h3>
            <p className="mt-1 text-xs text-gray-500">Sur l’ensemble des commandes enregistrées</p>
          </div>
          {stats.modeTotal === 0 ? (
            <p className="py-3 text-sm text-gray-500">Aucune commande enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'on_site', label: 'Sur place', icon: <Utensils className="w-4 h-4 text-gray-600" /> },
                { key: 'takeaway', label: 'À emporter', icon: <ShoppingCart className="w-4 h-4 text-gray-600" /> },
                { key: 'delivery', label: 'Livraison', icon: <Truck className="w-4 h-4 text-gray-600" /> },
              ].map((item) => {
                const count = stats.modeCounts[item.key]
                const percentage = Math.round((count / stats.modeTotal) * 100)

                return (
                  <div key={item.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-gray-600">{item.label}</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {count} <span className="font-normal text-gray-500">({percentage} %)</span>
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${item.label} : ${percentage} % des commandes`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                      className="h-2 overflow-hidden rounded-full bg-gray-100"
                    >
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}