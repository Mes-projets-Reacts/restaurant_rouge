import { CalendarDays, Clock3, MapPin, Truck, Utensils } from 'lucide-react'
import { OrderForm } from '@/components/order-form'
import { supabaseServer } from '@/lib/supabase-server'
import { DELIVERY_FEE, RESTAURANT_NAME } from '@/lib/restaurant-config'
import { getDakarDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

export default async function Home() {
  const today = getDakarDate()
  const { data: dailyMenu } = await supabaseServer
    .from('daily_menus')
    .select('dish_ids')
    .eq('date', today)
    .eq('is_published', true)
    .maybeSingle()

  let dishes: Array<{
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
  }> = []

  if (dailyMenu?.dish_ids?.length) {
    const { data } = await supabaseServer
      .from('dishes')
      .select('id, name, description, price, image_url')
      .in('id', dailyMenu.dish_ids)
      .eq('is_available', true)
      .order('name')

    dishes = data ?? []
  }

  return (
    <div className="pb-16">
      <section className="bg-orange-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-orange-100">
              <Utensils className="h-4 w-4" />
              Cuisine sénégalaise, préparée avec soin
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Bienvenue chez <span className="text-orange-300">{RESTAURANT_NAME}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-orange-100">
              Découvrez les plats du jour, choisissez ce qui vous fait envie et
              indiquez ensuite comment vous souhaitez le recevoir.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-orange-100">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <Truck className="h-4 w-4" /> Livraison : {DELIVERY_FEE.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <MapPin className="h-4 w-4" /> À emporter ou sur place
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-orange-700">
              <CalendarDays className="h-4 w-4" />
              {new Date(`${today}T12:00:00`).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Africa/Dakar',
              })}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Le menu du jour
            </h2>
            <p className="mt-2 text-gray-600">
              Sélectionnez vos plats. Vos informations seront demandées juste après.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            <Clock3 className="h-4 w-4" /> Commande du jour
          </span>
        </div>

        <OrderForm
          dishes={dishes}
          whatsappNumber={WHATSAPP_NUMBER}
          deliveryFee={DELIVERY_FEE}
        />
      </section>
    </div>
  )
}
