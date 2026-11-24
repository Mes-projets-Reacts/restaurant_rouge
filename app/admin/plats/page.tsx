'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, ImagePlus, Plus, Trash2, Edit2, X } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

export default function AdminPlats() {
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(currentImageUrl)
      return
    }

    const previewUrl = URL.createObjectURL(selectedImage)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [selectedImage, currentImageUrl])

  async function loadData() {
    const { data: dishesData } = await supabase
      .from('dishes')
      .select('*')
      .order('created_at', { ascending: false })
    setDishes(dishesData || [])
    setLoading(false)
  }

  function resetForm() {
    setEditing(null)
    setSelectedImage(null)
    setCurrentImageUrl(null)
    setErrorMessage('')
    setForm({ name: '', description: '', price: '', is_available: true })
  }

  async function saveDish() {
    const price = Number(form.price)
    if (!form.name.trim() || !Number.isInteger(price) || price <= 0) {
      setErrorMessage('Indiquez un nom et un prix entier supérieur à zéro.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    let uploadedPath: string | null = null
    let imageUploaded = false

    try {
      let imageUrl = currentImageUrl
      if (selectedImage) {
        const extension = selectedImage.type === 'image/png'
          ? 'png'
          : selectedImage.type === 'image/webp'
            ? 'webp'
            : 'jpg'
        uploadedPath = `${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('dish-images')
          .upload(uploadedPath, selectedImage, { contentType: selectedImage.type, upsert: false })
        if (uploadError) throw uploadError
        imageUploaded = true
        imageUrl = supabase.storage.from('dish-images').getPublicUrl(uploadedPath).data.publicUrl
      }

      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        price,
        is_available: form.is_available,
        image_url: imageUrl,
      }

      if (editing) {
        const { error } = await supabase.from('dishes').update(payload).eq('id', editing)
        if (error) throw error
      } else {
        const { error } = await supabase.from('dishes').insert([payload])
        if (error) throw error
      }

      setOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      console.error('Unable to save dish:', error)
      if (uploadedPath && imageUploaded) {
        const { error: cleanupError } = await supabase.storage.from('dish-images').remove([uploadedPath])
        if (cleanupError) console.error('Unable to remove orphaned dish image:', cleanupError)
      }
      const details = error instanceof Error ? error.message : String(error)
      if (/bucket.*not found/i.test(details)) {
        setErrorMessage('Le stockage des photos n’est pas créé. Exécutez la migration supabase/migrations/20261123_dish_images_bucket.sql dans Supabase.')
      } else if (/permission|row.level security|unauthorized|not allowed/i.test(details)) {
        setErrorMessage(`Supabase a refusé l’envoi : ${details}. Vérifiez la session propriétaire et les politiques du bucket dish-images.`)
      } else {
        setErrorMessage(`Enregistrement impossible : ${details}`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteDish(id: string) {
    if (!confirm('Supprimer ce plat ?')) return
    const { error } = await supabase.from('dishes').delete().eq('id', id)
    if (error) {
      setErrorMessage('Impossible de supprimer ce plat.')
      return
    }
    await loadData()
  }

  async function toggleAvailable(id: string, current: boolean) {
    await supabase.from('dishes').update({ is_available: !current }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des plats</h1>
        <Button
          onClick={() => { resetForm(); setOpen(true) }}
          size="icon"
          title="Ajouter un plat"
          aria-label="Ajouter un plat"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="pb-3 font-medium">Plat</th>
              <th className="pb-3 font-medium">Prix</th>
              <th className="pb-3 font-medium">Statut</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => (
              <tr key={d.id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  <span className="flex items-center gap-3">
                    {d.image_url ? (
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={d.image_url} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-400">
                        <ImagePlus className="h-4 w-4" />
                      </span>
                    )}
                    {d.name}
                  </span>
                </td>
                <td className="py-3 font-medium">{formatFCFA(d.price)}</td>
                <td className="py-3">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${d.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {d.is_available ? 'Disponible' : 'Indisponible'}
                  </span>
                </td>
                <td className="py-3 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditing(d.id)
                      setSelectedImage(null)
                      setCurrentImageUrl(d.image_url || null)
                      setErrorMessage('')
                      setForm({
                        name: d.name,
                        description: d.description || '',
                        price: d.price.toString(),
                        is_available: d.is_available,
                      })
                      setOpen(true)
                    }}
                    title="Modifier le plat"
                    aria-label={`Modifier ${d.name}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDish(d.id)}
                    title="Supprimer le plat"
                    aria-label={`Supprimer ${d.name}`}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAvailable(d.id, d.is_available)}
                    title={d.is_available ? 'Désactiver le plat' : 'Activer le plat'}
                    aria-label={d.is_available ? `Désactiver ${d.name}` : `Activer ${d.name}`}
                    className={d.is_available ? 'text-orange-600' : 'text-green-600'}
                  >
                    {d.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-4">
          <div className="flex min-h-full items-start justify-center sm:items-center">
            <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
              <h2 className="shrink-0 border-b border-gray-100 px-5 py-4 text-xl font-bold sm:px-6">
                {editing ? 'Modifier le plat' : 'Nouveau plat'}
              </h2>
              <form onSubmit={(e) => { e.preventDefault(); saveDish() }} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Photo du plat</label>
                    {imagePreview ? (
                      <div className="relative mb-3 h-44 overflow-hidden rounded-xl bg-gray-100">
                        <Image src={imagePreview} alt="Aperçu de la photo du plat" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => { setSelectedImage(null); setCurrentImageUrl(null) }}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow"
                          aria-label="Retirer la photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-orange-400 hover:bg-orange-50">
                        <ImagePlus className="mb-2 h-7 w-7 text-orange-600" />
                        <span className="text-sm font-medium text-gray-800">Ajouter une photo</span>
                        <span className="mt-1 text-xs text-gray-500">JPG, PNG ou WebP · 5 Mo max.</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                              setErrorMessage('Choisissez une image JPG, PNG ou WebP de 5 Mo maximum.')
                              event.target.value = ''
                              return
                            }
                            setErrorMessage('')
                            setSelectedImage(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nom du plat</label>
                    <input
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Prix (FCFA)</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    Disponible
                  </label>
                  {errorMessage && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}