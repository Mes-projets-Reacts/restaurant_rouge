import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { RESTAURANT_NAME } from '@/lib/restaurant-config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export function getDakarDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Dakar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function isValidSenegalPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  return /^(70|76|77|78|75|72|74)\d{7}$/.test(cleaned)
}

export function generateWhatsAppLink(
  phone: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}

export function buildOrderMessage({
  customerName,
  customerPhone,
  deliveryMode,
  deliveryAddress,
  items,
  subtotal,
  deliveryFee,
  total,
}: {
  customerName: string
  customerPhone: string
  deliveryMode: 'takeaway' | 'on_site' | 'delivery'
  deliveryAddress?: string
  items: Array<{ name: string; qty: number; price: number }>
  subtotal: number
  deliveryFee: number
  total: number
}): string {
  const modeLabels = {
    takeaway: 'À emporter',
    on_site: 'Sur place',
    delivery: 'Livraison',
  }

  const itemsText = items
    .map((item) => `- ${item.name} x${item.qty} (${formatFCFA(item.price * item.qty)})`)
    .join('\n')

  const lines = [
    `*Nouvelle commande ${RESTAURANT_NAME}*`,
    '',
    `Client: ${customerName}`,
    `Tél: ${customerPhone}`,
    `Mode: ${modeLabels[deliveryMode]}`,
  ]

  if (deliveryMode === 'delivery' && deliveryAddress) {
    lines.push(`Adresse: ${deliveryAddress}`)
  }

  lines.push('', 'Plats:', itemsText, '')
  lines.push(`Sous-total: ${formatFCFA(subtotal)}`)

  if (deliveryFee > 0) {
    lines.push(`Frais de livraison: ${formatFCFA(deliveryFee)}`)
  }

  lines.push(`Total: ${formatFCFA(total)}`, '', 'Paiement à la livraison / au restaurant.')

  return lines.join('\n')
}