import { RESTAURANT_NAME } from '@/lib/restaurant-config'
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutClient restaurantName={RESTAURANT_NAME}>
      {children}
    </AdminLayoutClient>
  )
}