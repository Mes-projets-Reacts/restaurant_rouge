'use client'

import Image from 'next/image'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  buildOrderMessage,
  formatFCFA,
  generateWhatsAppLink,
  isValidSenegalPhone,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Minus, Plus, ShoppingBag, Smartphone, Truck, Utensils } from 'lucide-react'

interface Dish {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

interface OrderFormProps {
  dishes: Dish[]
  whatsappNumber: string
  deliveryFee: number
}

type DeliveryMode = 'takeaway' | 'on_site' | 'delivery'

const deliveryOptions: Array<{
  value: DeliveryMode
  label: string
  description: string
  icon: typeof Utensils
}> = [
  { value: 'takeaway', label: 'À emporter', description: 'Je viens récupérer ma commande', icon: ShoppingBag },
  { value: 'on_site', label: 'Sur place', description: 'Je mange au restaurant', icon: Utensils },
  { value: 'delivery', label: 'Livraison', description: 'Je me fais livrer à Dakar', icon: Truck },
]

export function OrderForm({ dishes, whatsappNumber, deliveryFee }: OrderFormProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryMode: 'takeaway' as DeliveryMode,
    deliveryAddress: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const selectedItems = dishes
    .filter((dish) => (quantities[dish.id] || 0) > 0)
    .map((dish) => ({
      ...dish,
      qty: quantities[dish.id]!,
    }))

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const appliedDeliveryFee = form.deliveryMode === 'delivery' ? deliveryFee : 0
  const total = subtotal + appliedDeliveryFee

  function changeQuantity(dishId: string, delta: number) {
    setQuantities((current) => {
      const next = (current[dishId] || 0) + delta
      if (next <= 0) {
        const { [dishId]: _removed, ...remaining } = current
        return remaining
      }
      return { ...current, [dishId]: Math.min(next, 99) }
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!selectedItems.length) {
      setErrorMessage('Choisissez au moins un plat dans le menu.')
      return
    }
    if (!isValidSenegalPhone(form.customerPhone)) {
      setErrorMessage('Numéro de téléphone sénégalais invalide (ex. : 77XXXXXXX).')
      return
    }
    if (form.deliveryMode === 'delivery' && !form.deliveryAddress.trim()) {
      setErrorMessage('Indiquez une adresse pour la livraison.')
      return
    }
    if (!whatsappNumber) {
      setErrorMessage('Le numéro WhatsApp du restaurant n’est pas encore configuré.')
      return
    }

    setLoading(true)
    try {
      const { data: order, error } = await supabase.rpc('create_order', {
        p_customer_name: form.customerName.trim(),
        p_customer_phone: form.customerPhone.replace(/\s/g, ''),
        p_delivery_mode: form.deliveryMode,
        p_delivery_address: form.deliveryMode === 'delivery' ? form.deliveryAddress.trim() : null,
        p_items: selectedItems.map(({ id, qty }) => ({ id, qty })),
      })
      if (error) throw error
      if (!order) throw new Error('La base de données n’a pas confirmé la commande.')

      const message = buildOrderMessage({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.replace(/\s/g, ''),
        deliveryMode: form.deliveryMode,
        deliveryAddress: form.deliveryAddress.trim(),
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        total: order.total,
      })
      setWhatsappLink(generateWhatsAppLink(whatsappNumber, message))
      setSuccess(true)
    } catch (error) {
      console.error('Unable to submit restaurant order:', error)
      setErrorMessage('Impossible d’enregistrer la commande. Vérifiez votre connexion puis réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 px-6 py-12 text-center sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-gray-950">Commande enregistrée !</h2>
        <p className="mx-auto mt-2 max-w-lg text-gray-600">
          Votre commande est prête. Envoyez son récapitulatif au restaurant pour la confirmer.
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
        >
          <Smartphone className="h-5 w-5" />
          Envoyer sur WhatsApp
        </a>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 block w-full text-sm font-medium text-gray-600 underline underline-offset-4"
        >
          Passer une autre commande
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {dishes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-16 text-center">
          <Utensils className="mx-auto h-10 w-10 text-orange-500" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Le menu du jour arrive bientôt</h3>
          <p className="mt-2 text-gray-600">
            Aucun plat n’est publié pour aujourd’hui. Revenez un peu plus tard.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => {
              const quantity = quantities[dish.id] || 0

              return (
                <article
                  key={dish.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border bg-white shadow-sm transition',
                    quantity > 0 ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200 hover:shadow-md'
                  )}
                >
                  <div className="relative h-52 bg-orange-50">
                    {dish.image_url ? (
                      <Image
                        src={dish.image_url}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-orange-300">
                        <Utensils className="h-10 w-10" />
                        <span className="text-sm font-medium">Photo bientôt disponible</span>
                      </div>
                    )}
                    {quantity > 0 && (
                      <span className="absolute right-3 top-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-600 px-2 text-sm font-bold text-white shadow">
                        {quantity}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="min-h-16">
                      <h3 className="text-lg font-bold text-gray-950">{dish.name}</h3>
                      {dish.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{dish.description}</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-orange-700">{formatFCFA(dish.price)}</span>
                      {quantity === 0 ? (
                        <button
                          type="button"
                          onClick={() => changeQuantity(dish.id, 1)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 font-semibold text-white transition hover:bg-orange-700"
                        >
                          <Plus className="h-4 w-4" /> Ajouter
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-3 rounded-xl bg-orange-50 p-1">
                          <button
                            type="button"
                            aria-label={`Retirer un ${dish.name}`}
                            onClick={() => changeQuantity(dish.id, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-700 shadow-sm"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-5 text-center font-bold text-gray-900">{quantity}</span>
                          <button
                            type="button"
                            aria-label={`Ajouter un ${dish.name}`}
                            disabled={quantity >= 99}
                            onClick={() => changeQuantity(dish.id, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-700 shadow-sm disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {selectedItems.length > 0 && (
            <form onSubmit={handleSubmit} className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Votre sélection</p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-950">Comment recevoir votre commande ?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedItems.reduce((sum, item) => sum + item.qty, 0)} article(s) sélectionné(s)
                  </p>
                </div>
                <ShoppingBag className="mt-1 h-6 w-6 shrink-0 text-orange-600" />
              </div>

              <div className="space-y-8">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-gray-900">1. Mode de réception</legend>
                  <div className="grid gap-3 md:grid-cols-3">
                    {deliveryOptions.map(({ value, label, description, icon: Icon }) => {
                      const isSelected = form.deliveryMode === value
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setForm({ ...form, deliveryMode: value, deliveryAddress: '' })}
                          className={cn(
                            'flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition',
                            isSelected
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100'
                              : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/40'
                          )}
                        >
                          <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', isSelected ? 'text-orange-700' : 'text-gray-500')} />
                          <span>
                            <span className="block font-semibold text-gray-900">{label}</span>
                            <span className="mt-1 block text-xs text-gray-600">{description}</span>
                            {value === 'delivery' && (
                              <span className="mt-2 block text-xs font-semibold text-orange-700">
                                + {formatFCFA(deliveryFee)}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                {form.deliveryMode === 'delivery' && (
                  <div>
                    <label htmlFor="delivery-address" className="mb-2 block text-sm font-semibold text-gray-900">
                      Adresse de livraison
                    </label>
                    <input
                      id="delivery-address"
                      type="text"
                      required
                      maxLength={500}
                      placeholder="Quartier, rue, repère..."
                      value={form.deliveryAddress}
                      onChange={(event) => setForm({ ...form, deliveryAddress: event.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                )}

                <fieldset className="grid gap-5 border-t border-gray-100 pt-7 sm:grid-cols-2">
                  <legend className="mb-4 text-sm font-semibold text-gray-900">2. Vos coordonnées</legend>
                  <div>
                    <label htmlFor="customer-name" className="mb-2 block text-sm font-medium text-gray-700">
                      Votre nom
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      maxLength={120}
                      autoComplete="name"
                      value={form.customerName}
                      onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-phone" className="mb-2 block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <input
                      id="customer-phone"
                      type="number"
                      required
                      min={700000000}
                      max={789999999}
                      step={1}
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="77XXXXXXX"
                      value={form.customerPhone}
                      onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </fieldset>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 text-sm text-gray-600">
                        <span>{item.name} × {item.qty}</span>
                        <span>{formatFCFA(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-sm text-gray-600">
                      <span>Sous-total</span>
                      <span>{formatFCFA(subtotal)}</span>
                    </div>
                    {appliedDeliveryFee > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Livraison</span>
                        <span>{formatFCFA(appliedDeliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 text-lg font-bold text-gray-950">
                      <span>Total</span>
                      <span className="text-orange-700">{formatFCFA(total)}</span>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-6 text-base font-semibold"
                >
                  {loading ? 'Enregistrement...' : 'Confirmer et continuer sur WhatsApp'}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Votre commande sera enregistrée avant l’ouverture de WhatsApp.
                </p>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
