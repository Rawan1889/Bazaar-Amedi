'use server'

import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'
import { sniffImage } from './image-sniff'

export async function uploadProductImage(formData: FormData) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5MB.' }
  }

  const kind = await sniffImage(file)
  if (!kind) return { error: 'Please upload a JPG, PNG, WebP or GIF photo.' }

  const supabase = await createBazaarServer()

  const ext = kind.ext
  const path = `products/${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('bazaar-images')
    .upload(path, file, { contentType: kind.mime, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage
    .from('bazaar-images')
    .getPublicUrl(path)

  return { url: data.publicUrl }
}

export async function uploadShopImage(formData: FormData, type: 'logo' | 'cover') {
  const user = await getBazaarUser()
  if (!user) return { error: 'Unauthorized' }
  if (type !== 'logo' && type !== 'cover') return { error: 'Invalid image type.' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5MB.' }
  }

  const kind = await sniffImage(file)
  if (!kind) return { error: 'Please upload a JPG, PNG, WebP or GIF photo.' }

  const supabase = await createBazaarServer()

  const ext = kind.ext
  const path = `shops/${user.id}/${type}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('bazaar-images')
    .upload(path, file, { contentType: kind.mime, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage
    .from('bazaar-images')
    .getPublicUrl(path)

  return { url: data.publicUrl }
}
