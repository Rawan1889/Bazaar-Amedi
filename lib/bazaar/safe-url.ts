// Returns the path only if it stays on this site ("/orders/123"), otherwise null.
// Rejects absolute URLs, protocol-relative "//evil.com", backslash tricks and
// javascript: links, so stored links can't send users off-site.
export function safeInternalPath(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const u = url.trim()
  if (!u.startsWith('/') || u.startsWith('//') || u.startsWith('/\\')) return null
  if (/[\u0000-\u001f]/.test(u)) return null
  return u
}
