'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/admin/sidebar'
import { Menu, Shield, DollarSign, ClipboardList, FileText } from 'lucide-react'

export function AdminLayoutClient({
  children,
  restaurantName,
}: {
  children: React.ReactNode
  restaurantName: string
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register'

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isAuthPage) return <>{children}</>

  const navItems = [
    { href: '/admin', label: 'Tableau de bord', icon: <DollarSign className="w-5 h-5" /> },
    { href: '/admin/plats', label: 'Plats', icon: <FileText className="w-5 h-5" /> },
    { href: '/admin/menu-du-jour', label: 'Menu du jour', icon: <ClipboardList className="w-5 h-5" /> },
    { href: '/admin/commandes', label: 'Commandes', icon: <Shield className="w-5 h-5" /> },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        current={pathname}
        restaurantName={restaurantName}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => window.location.assign('/logout')}
      />
      <main className="min-w-0 flex-1 bg-gray-50 md:h-screen md:overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir la navigation d’administration"
            aria-expanded={sidebarOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-gray-900">Admin {restaurantName}</span>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
