'use client'

import Image from 'next/image'

interface DishCardProps {
  dish: {
    id: string
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    is_available: boolean
  }
}

export function DishCard({ dish }: DishCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div className="relative h-48 overflow-hidden">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Aucune photo</span>
          </div>
        )}
        {!dish.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold bg-black/60 px-3 py-1 rounded">
              Indisponible
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
        {dish.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {dish.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-orange-600">{dish.price.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
    </div>
  )
}