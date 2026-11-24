'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LogOut, X } from 'lucide-react'

interface SidebarItem {
  href: string
  label: string
  icon: ReactNode
}

export function Sidebar({
  items,
  current,
  restaurantName,
  mobileOpen,
  onClose,
  onLogout,
}: {
  items: SidebarItem[]
  current: string
  restaurantName: string
  mobileOpen: boolean
  onClose: () => void
  onLogout: () => void
}) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      <div className="flex items-center justify-between border-b border-gray-200 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-lg text-gray-900">Admin {restaurantName}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {items.map((item) => {
          const isActive = current === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => { onClose(); onLogout() }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
      </aside>
    </>
  )
}