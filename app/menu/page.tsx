import { CalendarDays, Clock } from 'lucide-react'
import { OrderForm } from '@/components/order-form'
import { DELIVERY_FEE } from '@/lib/restaurant-config'
import { supabaseServer } from '@/lib/supabase-server'
import { getDakarDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

export default async function MenuPage() {
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">Menu du jour</h1>
          <p className="mt-2 text-gray-600">Choisissez vos plats, puis indiquez comment les recevoir.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
          <Clock className="h-4 w-4" /> Préparé aujourd’hui
        </span>
      </div>

      <OrderForm
        dishes={dishes}
        whatsappNumber={WHATSAPP_NUMBER}
        deliveryFee={DELIVERY_FEE}
      />
    </div>
  )
}
