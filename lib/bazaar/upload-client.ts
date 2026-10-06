// Client-side helpers for image uploads.
//
// Phone photos are often 3–8 MB. Shrinking them in the browser first keeps
// uploads fast on mobile data and well under the server-action body limit.

const MAX_SIDE = 1600

export async function shrinkImage(file: File): Promise<File> {
  // GIFs would lose their animation; tiny files don't need it.
  if (file.type === 'image/gif' || file.size < 400 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    // HEIC or anything the browser can't decode: send the original.
    return file
  }
}

// Shrinks the file, builds the FormData and runs the upload action. Never
// throws, so callers can always clear their "uploading" state.
export async function uploadImageFile(
  file: File,
  action: (fd: FormData) => Promise<{ url?: string; error?: string }>,
): Promise<{ url?: string; error?: string }> {
  try {
    const fd = new FormData()
    fd.append('file', await shrinkImage(file))
    return await action(fd)
  } catch {
    return { error: 'Upload failed. Check your connection and try a smaller photo.' }
  }
}
