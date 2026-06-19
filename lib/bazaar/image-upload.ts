'use server'

import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export async function uploadProductImage(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (!file.type.startsWith('image/')) {
    return { error: 'Only image files are allowed.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5MB.' }
  }

  const supabase = await createBazaarServer()

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `products/${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('bazaar-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage
    .from('bazaar-images')
    .getPublicUrl(path)

  return { url: data.publicUrl }
}

export async function uploadShopImage(formData: FormData, type: 'logo' | 'cover') {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (!file.type.startsWith('image/')) {
    return { error: 'Only image files are allowed.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5MB.' }
  }

  const supabase = await createBazaarServer()

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `shops/${user.id}/${type}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('bazaar-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage
    .from('bazaar-images')
    .getPublicUrl(path)

  return { url: data.publicUrl }
}
