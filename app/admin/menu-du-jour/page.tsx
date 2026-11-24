'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatFCFA, getDakarDate } from '@/lib/utils'
import { CheckCircle2, Clock, EyeOff, Loader2, Save, Send, X } from 'lucide-react'

export default function AdminMenuDuJour() {
  const [dishes, setDishes] = useState<any[]>([])
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([])
  const [todayMenu, setTodayMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = getDakarDate()

    try {
      const [dRes, mRes] = await Promise.all([
        supabase.from('dishes').select('*').eq('is_available', true).order('name'),
        supabase.from('daily_menus').select('*').eq('date', today).maybeSingle(),
      ])
      if (dRes.error) throw dRes.error
      if (mRes.error) throw mRes.error

      setDishes(dRes.data || [])
      setTodayMenu(mRes.data || null)
      setSelectedDishIds(mRes.data?.dish_ids || [])
      return true
    } catch (error) {
      console.error('Unable to load daily menu:', error)
      setErrorMessage('Impossible de charger le menu du jour. Vérifiez votre connexion et les accès Supabase.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const isPublished = todayMenu?.is_published || false
  const savedDishIds: string[] = todayMenu?.dish_ids || []
  const hasChanges = selectedDishIds.length !== savedDishIds.length
    || selectedDishIds.some((id) => !savedDishIds.includes(id))

  function showSuccess(message: string) {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 4000)
  }

  async function saveMenu() {
    if (selectedDishIds.length === 0) {
      setErrorMessage('Sélectionnez au moins un plat avant de publier le menu.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    const today = getDakarDate()

    try {
      if (todayMenu) {
        const { error } = await supabase
          .from('daily_menus')
          .update({
            dish_ids: selectedDishIds,
            is_published: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', todayMenu.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('daily_menus').insert({
          date: today,
          dish_ids: selectedDishIds,
          is_published: true,
        })
        if (error) throw error
      }

      const refreshed = await loadData()
      if (refreshed) {
        showSuccess(isPublished ? 'Modifications du menu enregistrées.' : 'Menu du jour publié et visible par les clients.')
      }
    } catch (error) {
      console.error('Unable to save daily menu:', error)
      setErrorMessage('Impossible d’enregistrer le menu. Vérifiez les accès Supabase et réessayez.')
    } finally {
      setSaving(false)
    }
  }

  async function unpublish() {
    if (!todayMenu) return
    setUnpublishing(true)
    setErrorMessage('')
    try {
      const { error } = await supabase
        .from('daily_menus')
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq('id', todayMenu.id)
      if (error) throw error
      setTodayMenu({ ...todayMenu, is_published: false })
      showSuccess('Menu retiré du site. Votre sélection est conservée en brouillon.')
    } catch (error) {
      console.error('Unable to unpublish daily menu:', error)
      setErrorMessage('Impossible de retirer le menu. Vérifiez les accès Supabase et réessayez.')
    } finally {
      setUnpublishing(false)
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>

  const subtotal = dishes
    .filter((d) => selectedDishIds.includes(d.id))
    .reduce((sum, d) => sum + d.price, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu du jour</h1>
          <p className="text-gray-500">
            Sélectionnez les plats disponibles aujourd'hui et publiez le menu.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-gray-900">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'Africa/Dakar',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {isPublished ? 'Publié — vous pouvez modifier les plats ci-dessous' : 'Brouillon'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isPublished && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={saving || unpublishing}
                onClick={unpublish}
                title={unpublishing ? 'Retrait du menu en cours' : 'Retirer le menu du site'}
                aria-label={unpublishing ? 'Retrait du menu en cours' : 'Retirer le menu du site'}
              >
                {unpublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              disabled={selectedDishIds.length === 0 || saving || unpublishing || (isPublished && !hasChanges)}
              onClick={saveMenu}
              title={saving
                ? 'Enregistrement en cours'
                : isPublished
                  ? 'Enregistrer les modifications'
                  : 'Publier le menu'}
              aria-label={saving
                ? 'Enregistrement en cours'
                : isPublished
                  ? 'Enregistrer les modifications'
                  : 'Publier le menu'}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isPublished ? (
                <Save className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {isPublished && hasChanges && (
          <p className="mb-5 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Modifications non enregistrées : ajoutez ou retirez des plats, puis enregistrez le menu.
          </p>
        )}

        <div className="space-y-4">
          {dishes.map((dish) => {
            const isSelected = selectedDishIds.includes(dish.id)
            return (
              <div
                key={dish.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      setErrorMessage('')
                      setSuccessMessage('')
                      setSelectedDishIds((current) => isSelected
                        ? current.filter((id) => id !== dish.id)
                        : [...current, dish.id])
                    }}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{dish.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFCFA(dish.price)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {selectedDishIds.includes(dish.id) ? 'Sélectionné' : 'Non sélectionné'}
                </span>
              </div>
            )
          })}
        </div>

        {selectedDishIds.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-600">Total estimé du menu</span>
              <span className="text-orange-600">{formatFCFA(subtotal)}</span>
            </div>
          </div>
        )}
      </div>

      {!isPublished && dishes.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          Aucun plat disponible. Ajoutez des plats d'abord.
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl bg-green-700 px-4 py-3 text-white shadow-lg"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm font-medium">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            aria-label="Fermer la notification"
            className="rounded p-0.5 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}