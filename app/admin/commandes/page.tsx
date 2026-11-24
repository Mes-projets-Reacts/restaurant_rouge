'use client'

import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState, ReactNode } from 'react'
import { formatFCFA } from '@/lib/utils'
import { generateWhatsAppLink } from '@/lib/utils'
import { Truck, Utensils, ShoppingCart, Clock, Check, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { RESTAURANT_NAME } from '@/lib/restaurant-config'

const ORDERS_PER_PAGE = 25

const modeConfig: Record<string, { label: string; icon: ReactNode; color: string }> = {
  takeaway: { label: 'À emporter', icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  on_site: { label: 'Sur place', icon: <Utensils className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  delivery: { label: 'Livraison', icon: <Truck className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
}

export default function AdminCommandes() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const loadOrders = useCallback(async (page: number) => {
    setLoading(true)
    const firstItem = (page - 1) * ORDERS_PER_PAGE

    try {
      const { data, count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(firstItem, firstItem + ORDERS_PER_PAGE - 1)

      if (error) throw error
      setOrders(data || [])
      setTotalOrders(count || 0)
      setErrorMessage('')
    } catch (error) {
      console.error('Unable to load orders:', error)
      setOrders([])
      setTotalOrders(0)
      setErrorMessage('Impossible de charger les commandes. Vérifiez votre connexion et les accès Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders(currentPage)
  }, [currentPage, loadOrders])

  async function confirmOrder(id: string) {
    const { error } = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', id)
    if (error) {
      console.error('Unable to confirm order:', error)
      setErrorMessage('Impossible de confirmer la commande.')
      return
    }
    loadOrders(currentPage)
  }

  async function doneOrder(id: string) {
    const { error } = await supabase.from('orders').update({ status: 'done' }).eq('id', id)
    if (error) {
      console.error('Unable to complete order:', error)
      setErrorMessage('Impossible de terminer la commande.')
      return
    }
    loadOrders(currentPage)
  }

  if (loading) return <div className="p-6">Chargement des commandes...</div>

  const pageCount = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE))
  const firstVisibleOrder = totalOrders === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1
  const lastVisibleOrder = Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium">Téléphone</th>
              <th className="pb-3 font-medium">Mode</th>
              <th className="pb-3 font-medium">Adresse</th>
              <th className="pb-3 font-medium text-right">Total</th>
              <th className="pb-3 font-medium text-center">Statut</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const cfg = modeConfig[o.delivery_mode]
              return (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{o.customer_name}</td>
                  <td className="py-3">{o.customer_phone}</td>
                  <td className="py-3">
                    <span
                      title={cfg.label}
                      aria-label={`Mode : ${cfg.label}`}
                      className={`inline-flex items-center justify-center rounded-full p-2 ${cfg.color}`}
                    >
                      {cfg.icon}
                      <span className="sr-only">{cfg.label}</span>
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {o.delivery_address || (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-3 font-medium text-right">
                    {formatFCFA(o.total)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${o.status === 'new' ? 'bg-yellow-100 text-yellow-700' : o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                    `}>
                      {o.status === 'new' ? 'Nouvelle' : o.status === 'confirmed' ? 'Confirmée' : 'Terminée'}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {o.status === 'new' && (
                      <button
                        onClick={() => confirmOrder(o.id)}
                        title="Confirmer la commande"
                        aria-label={`Confirmer la commande de ${o.customer_name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    {o.status === 'confirmed' && (
                      <button
                        onClick={() => doneOrder(o.id)}
                        title="Marquer comme terminée"
                        aria-label={`Terminer la commande de ${o.customer_name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 hover:text-green-800"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const message = `*Commande confirmée - ${RESTAURANT_NAME}*\n\nClient: ${o.customer_name}\nTél: ${o.customer_phone}\nStatut: ${o.status === 'confirmed' ? 'Confirmée et en préparation' : 'Terminée'}\n\nMerci pour votre commande !`
                        const link = generateWhatsAppLink(o.customer_phone.replace('+', ''), message)
                        window.open(link, '_blank')
                      }}
                      title="Contacter le client sur WhatsApp"
                      aria-label={`Contacter ${o.customer_name} sur WhatsApp`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#25D366] hover:bg-green-50 hover:text-green-700"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && !errorMessage && (
        <div className="text-center py-20 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune commande pour le moment.</p>
        </div>
      )}

      {totalOrders > 0 && (
        <nav
          aria-label="Pagination des commandes"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-gray-600">
            Commandes {firstVisibleOrder} à {lastVisibleOrder} sur {totalOrders}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
              title="Page précédente"
              aria-label="Page précédente"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-20 text-center text-sm text-gray-600">
              Page {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage >= pageCount}
              title="Page suivante"
              aria-label="Page suivante"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}