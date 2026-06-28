'use server'

import webpush from 'web-push'
import { createBazaarAdmin, createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey }
}

function initWebPush() {
  const keys = getVapidKeys()
  if (!keys) return false
  webpush.setVapidDetails(
    'mailto:support@bazaaramedi.com',
    keys.publicKey,
    keys.privateKey
  )
  return true
}

export async function saveSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createBazaarServer()

  const { error } = await supabase
    .from('bazaar_push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'user_id,endpoint' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeSubscription(endpoint: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createBazaarServer()

  await supabase
    .from('bazaar_push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  return { success: true }
}

export async function sendPushToUser(
  userId: string,
  notification: { title: string; body: string; url?: string; type: string }
) {
  if (!initWebPush()) return

  const admin = createBazaarAdmin()

  await admin.from('bazaar_notifications').insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: { url: notification.url },
  })

  const { data: subs } = await admin
    .from('bazaar_push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url || '/',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await admin
            .from('bazaar_push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      })
    )
  )

  return results
}

export async function sendPushToRole(
  role: string,
  notification: { title: string; body: string; url?: string; type: string }
) {
  if (!initWebPush()) return

  const admin = createBazaarAdmin()

  const { data: users } = await admin
    .from('bazaar_profiles')
    .select('id')
    .eq('role', role)

  if (!users?.length) return

  await Promise.allSettled(
    users.map(u => sendPushToUser(u.id, notification))
  )
}

// Only notify drivers who are currently online — avoids waking up off-duty drivers.
export async function sendPushToOnlineDrivers(
  notification: { title: string; body: string; url?: string; type: string }
) {
  if (!initWebPush()) return

  const admin = createBazaarAdmin()

  const { data: drivers } = await admin
    .from('bazaar_profiles')
    .select('id')
    .eq('role', 'driver')
    .eq('is_online', true)
    .eq('is_approved', true)

  if (!drivers?.length) return

  await Promise.allSettled(
    drivers.map(d => sendPushToUser(d.id, notification))
  )
}

export async function getMyNotifications() {
  const user = await getBazaarUser()
  if (!user) return []

  const supabase = await createBazaarServer()

  const { data } = await supabase
    .from('bazaar_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export async function markNotificationRead(notificationId: string) {
  const user = await getBazaarUser()
  if (!user) return

  const supabase = await createBazaarServer()

  await supabase
    .from('bazaar_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
}

export async function markAllNotificationsRead() {
  const user = await getBazaarUser()
  if (!user) return

  const supabase = await createBazaarServer()

  await supabase
    .from('bazaar_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
}

export async function getUnreadCount() {
  const user = await getBazaarUser()
  if (!user) return 0

  const supabase = await createBazaarServer()

  const { count } = await supabase
    .from('bazaar_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count || 0
}
